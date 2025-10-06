import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AuthService } from '@/services/auth.service.js';
import { UpdateUserData, UpdateUserSchema } from '@/schemas';
import { usersDb } from '../db';
import { AppDataSource } from '../database.js';
import { User } from '../entities/User.js';

export default async function userRoutes(fastify: FastifyInstance) {
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify<{ userId: number }>();
    } catch {
      return reply.code(401).send({ error: 'Authentication required', message: 'Please provide a valid token' });
    }
  };

  fastify.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const { userId } = request.user as { userId: number };
    const user = await AuthService.getUserById(userId);
    if (!user) return reply.code(404).send({ error: 'User not found', message: 'User profile not found' });
    reply.send({ user });
  });

  fastify.put<{ Body: UpdateUserData }>('/', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: number };
      const validatedData = UpdateUserSchema.parse(request.body);
      const updatedUser = await AuthService.updateUser(userId, validatedData);
      reply.send({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.issues });
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return reply.code(404).send({ error: 'User not found', message: error.message });
        }
        if (error.message.includes('already exists')) {
          return reply.code(409).send({ error: 'Conflict', message: error.message });
        }
      }
      request.server.log.error(error);
      reply.code(500).send({ error: 'Internal server error', message: 'Failed to update user' });
    }
  });

  fastify.get<{ Querystring: { q?: string } }>('/search', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { q: query } = request.query;
      const { userId } = request.user as { userId: number };
      
      if (!query || query.length < 2) {
        return reply.send({ users: [] });
      }

      const users = await usersDb.searchUsers(query, userId);
      
      reply.send({ users });
    } catch (error) {
      request.server.log.error(error, 'Error searching users');
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post<{ Body: { username: string } }>('/username', async (request, reply) => {
    try {
      request.server.log.info({ body: request.body }, '🔍 Searching for user by username. Request body');
      const { username } = request.body;
      if (!username || typeof username !== 'string') {
        request.server.log.info('❌ Username is missing or invalid');
        return reply.code(400).send({ error: 'Username is required' });
      }
      const user = await AuthService.getUserByUsername(username);
      request.server.log.info({ user }, '🔍 Search result');
      if (!user) {
        request.server.log.info('❌ User not found');
        return reply.code(404).send({ error: 'User not found' });
      }
      const response = { id: user.id, username: user.username, display_name: user.display_name };
      request.server.log.info({ response }, '✅ Found user');
      reply.send(response);
    } catch (error) {
      request.server.log.error({ error }, '❌ Error in /users/by-username:');
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post<{ Body: { avatar: string } }>('/avatar', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: number };
      const { avatar } = request.body;
      
      if (!avatar || typeof avatar !== 'string') {
        return reply.code(400).send({ error: 'Avatar data is required' });
      }

      if (!avatar.startsWith('data:image/')) {
        return reply.code(400).send({ error: 'Invalid image format' });
      }

      const sizeInBytes = (avatar.length * 3) / 4;
      if (sizeInBytes > 5 * 1024 * 1024) {
        return reply.code(400).send({ error: 'File size too large (max 5MB)' });
      }

      const matches = avatar.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) {
        return reply.code(400).send({ error: 'Invalid image data format' });
      }

      const [, extension, base64Data] = matches;
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filename = `avatar_${userId}_${Date.now()}.${extension}`;
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      await fs.mkdir(uploadDir, { recursive: true });
      
      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, buffer);
      
      const avatarUrl = `/uploads/avatars/${filename}`;
      
      await usersDb.updateAvatar(userId, avatarUrl);
      
      reply.send({ message: 'Avatar updated successfully', avatarUrl });
    } catch (error) {
      request.server.log.error(error, 'Error uploading avatar');
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: number };
      
      const users = await usersDb.getAllUsers(userId);
      
      reply.send({ users });
    } catch (error) {
      request.server.log.error(error, 'Error fetching users');
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/test', async (request, reply) => {
    try {
      const users = await usersDb.getAllUsers(0);
      
      reply.send({ users });
    } catch (error) {
      request.server.log.error(error, 'Error fetching users');
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post<{ Body: { currentPassword: string; newPassword: string } }>('/change-password', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: number };
      const { currentPassword, newPassword } = request.body;

      if (!currentPassword || !newPassword) {
        return reply.code(400).send({ error: 'Current password and new password are required' });
      }

      if (newPassword.length < 6) {
        return reply.code(400).send({ error: 'New password must be at least 6 characters long' });
      }

      const userRepo = AppDataSource.getRepository(User);
      const userWithPassword = await userRepo.findOneBy({ id: userId });
      if (!userWithPassword || !userWithPassword.password_hash) {
        return reply.code(404).send({ error: 'User not found or no password set' });
      }

      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.password_hash);
      if (!isValidPassword) {
        return reply.code(400).send({ error: 'Current password is incorrect' });
      }

      const hashedNewPassword = await AuthService.hashPassword(newPassword);
      await usersDb.updatePassword(userId, hashedNewPassword);

      reply.send({ message: 'Password updated successfully' });
    } catch (error) {
      request.server.log.error(error, 'Error changing password');
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post<{ Body: { password: string } }>('/delete-account', { preHandler: requireAuth }, async (request, reply) => {
    try {
      console.log("ssssssssssssssssssssssssssssssssssss")
      const { userId } = request.user as { userId: number };
      const { password } = request.body;

      if (!password) {
        return reply.code(400).send({ error: 'Password is required for account deletion' });
      }
      const userRepo = AppDataSource.getRepository(User);
      const userWithPassword = await userRepo.findOneBy({ id: userId });
      console.log(userId);
      if (!userWithPassword || !userWithPassword.password_hash) {
        return reply.code(404).send({ error: 'User not found or no password set' });
      }
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, userWithPassword.password_hash);
      console.log(isValidPassword)
      if (!isValidPassword) {
        return reply.code(400).send({ error: 'Password is incorrect' });
      }
      console.log(12);
      await usersDb.deleteUser(userId);
      reply.send({ message: 'Account deleted successfully' });
    } catch (error) {
      request.server.log.error(error, 'Error deleting account');
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get<{ Querystring: { page?: string, limit?: string } }>('/match-history', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: number };
      const page = parseInt(request.query.page || "1");
      const limit = parseInt(request.query.limit || "10");

      const { GameService } = await import('../services/game.service.js');
      const result = await GameService.getMatchHistory(userId, page, limit);
      
      reply.send(result);
    } catch (error) {
      request.server.log.error(error, 'Error fetching match history');
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/game-stats', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: number };

      const { GameService } = await import('../services/game.service.js');
      const stats = await GameService.getGameStats(userId);
      
      reply.send(stats);
    } catch (error) {
      request.server.log.error(error, 'Error fetching game stats');
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/:id/game-stats', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const targetUserId = parseInt(id, 10);

      if (isNaN(targetUserId)) {
        return reply.code(400).send({ error: 'Geçersiz kullanıcı ID' });
      }

      const { GameService } = await import('../services/game.service.js');
      const stats = await GameService.getGameStats(targetUserId);
      
      reply.send(stats);
    } catch (error) {
      request.server.log.error(error, 'Error fetching user game stats');
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
