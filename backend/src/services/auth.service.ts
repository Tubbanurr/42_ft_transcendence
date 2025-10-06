import bcrypt from 'bcryptjs';
import { AppDataSource } from '../database.js';
import { User } from '../entities/User.js';
import { usersDb } from '@/db.js';
import type { RegisterData, LoginData, UpdateUserData } from '../schemas/index.js';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { encryptSecret, decryptSecret } from '@/utils/crypto';
import { randomBytes } from 'crypto';

export type SafeUser = Omit<User, 'password_hash'>;
function toSafeUser(u: User): SafeUser {
  const { password_hash, ...rest } = u as User;
  return rest as SafeUser;
}
export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  static async createUser(data: RegisterData): Promise<SafeUser> {
    const repo = AppDataSource.getRepository(User);
    const existingUser = await repo.findOne({
      where: [{ username: data.username }, { email: data.email }]
    });
    if (existingUser) {
      throw new Error('Username or email already exists');
    }
    const passwordHash = await this.hashPassword(data.password);
    const user = repo.create({
      username: data.username,
      email: data.email,
      password_hash: passwordHash,
      display_name: data.displayName || data.username,
      is_online: false
    });
    await repo.save(user);
    return toSafeUser(user);
  }
  static async authenticateUser(credentials: LoginData): Promise<SafeUser | null> {
    const user = await usersDb.getByUsernameOrEmail(credentials.username);
    if (!user || !user.password_hash) return null;
    const ok = await this.verifyPassword(credentials.password, user.password_hash);
    if (!ok) return null;
    return toSafeUser(user);
  }
  static async findOrCreateOAuthUser(profile: any): Promise<SafeUser> {
    const repo = AppDataSource.getRepository(User);
    
    let user = await usersDb.getByGoogleId(profile.id);
    
    if (!user) {
      if (profile.email) {
        const existingByEmail = await repo.findOne({ where: { email: profile.email } });
        if (existingByEmail) {
          existingByEmail.google_id = profile.id;
          if (profile.name) existingByEmail.display_name = profile.name;
          if (profile.picture) existingByEmail.avatar_url = profile.picture;
          await repo.save(existingByEmail);
          return toSafeUser(existingByEmail);
        }
      }
      
      user = repo.create({
        google_id: profile.id,
        email: profile.email,
        username: profile.email?.split("@")[0] || `google_${profile.id}`,
        display_name: profile.name || profile.email,
        avatar_url: profile.picture,
        is_online: false,
      });
      await repo.save(user);
    } else {
      let changed = false;
      if (profile.email && profile.email !== user.email) {
        user.email = profile.email; changed = true;
      }
      if (profile.name && profile.name !== user.display_name) {
        user.display_name = profile.name; changed = true;
      }
      if (profile.picture && profile.picture !== user.avatar_url) {
        user.avatar_url = profile.picture; changed = true;
      }
      if (changed) await repo.save(user);
    }
    
    return toSafeUser(user);
  }
  static async getUserById(id: number): Promise<SafeUser | null> {
    const user = await AppDataSource.getRepository(User).findOneBy({ id });
    return user ? toSafeUser(user) : null;
  }
  static async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    const updateData: any = { is_online: isOnline };
    
    if (!isOnline) {
      updateData.lastSeen = new Date();
    }
    
    await AppDataSource.getRepository(User).update({ id: userId }, updateData);
  }
  static async updateUser(userId: number, data: UpdateUserData): Promise<SafeUser> {
    const repo = AppDataSource.getRepository(User);
    const existingUser = await repo.findOneBy({ id: userId });
    if (!existingUser) throw new Error('User not found');
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await repo.findOne({ where: { email: data.email } });
      if (emailExists && emailExists.id !== userId) {
        throw new Error('Email already exists');
      }
    }
    if (data.display_name !== undefined) existingUser.display_name = data.display_name;
    if (data.email !== undefined) existingUser.email = data.email;
    if (data.avatar_url !== undefined) existingUser.avatar_url = data.avatar_url || undefined;
    if (data.password !== undefined) {
      existingUser.password_hash = await this.hashPassword(data.password);
    }
    await repo.save(existingUser);
    return toSafeUser(existingUser);
  }
  static async getUserByUsername(username: string): Promise<SafeUser | null> {
    const user = await AppDataSource.getRepository(User).findOneBy({ username });
    return user ? toSafeUser(user) : null;
  }

  static async generateTwoFactorSetup(userId: number) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) throw new Error('User not found');

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.username, 'Transcendence', secret);
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    user.two_factor_temp_secret = encryptSecret(secret);
    await repo.save(user);

    return { qr: qrDataUrl, secret };
  }

  static async verifyTwoFactorSetup(userId: number, token: string) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user || !user.two_factor_temp_secret) return false;

    const secret = decryptSecret(user.two_factor_temp_secret);
    const ok = authenticator.check(token, secret);
    if (!ok) return false;

    user.two_factor_secret = encryptSecret(secret);
    user.two_factor_temp_secret = null;
    user.two_factor_enabled = true;

    const codes = Array.from({length:8}).map(() => randomBytes(4).toString('hex'));
    user.two_factor_recovery_codes = JSON.stringify(codes);
    await repo.save(user);

    return { success: true, recoveryCodes: codes };
  }

  static async verifyTwoFactorLogin(userId: number, token: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user || !user.two_factor_enabled || !user.two_factor_secret) return false;
    const secret = decryptSecret(user.two_factor_secret);
    return authenticator.check(token, secret);
  }

  static async disableTwoFactor(userId: number): Promise<boolean> {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) return false;

    user.two_factor_enabled = false;
    user.two_factor_secret = null;
    user.two_factor_temp_secret = null;
    user.two_factor_recovery_codes = null;
    await repo.save(user);
    
    return true;
  }
}