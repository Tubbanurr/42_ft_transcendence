import { disconnectSocket } from '@/socket/client';
import { api } from './api';
import type { ApiResponse } from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  avatar?: string;
  createdAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user?: User;
  token?: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
}

export interface TwoFactorLoginRequest {
  twoFactorToken: string;
  code: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  private currentUser: User | null = null;

  public async login(credentials: LoginRequest): Promise<User | { requiresTwoFactor: true; twoFactorToken: string }> {
    try {
      const response = await api.post('/auth/login', credentials) as LoginResponse;
      
      console.log('Login response:', response);
      
      if (response.requiresTwoFactor && response.twoFactorToken) {
        return {
          requiresTwoFactor: true,
          twoFactorToken: response.twoFactorToken
        };
      }
      
      const token = response.token;
      const user = response.user;
      
      if (token && user) {
        api.setAuthToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser = user;
        this.notifyAuthChange();
        return user;
      } else {
        throw new Error('Invalid response format: missing token or user data');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  public async verifyTwoFactor(twoFactorToken: string, code: string): Promise<User> {
    try {
      const response = await api.verify2FALogin(twoFactorToken, code);
      
      console.log('2FA verification response:', response);
      
      const token = (response.data as any)?.token || (response as any).token;
      const user = (response.data as any)?.user || (response as any).user;
      
      if (token && user) {
        api.setAuthToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser = user;
        this.notifyAuthChange();
        return user;
      } else {
        throw new Error('Invalid response format: missing token or user data');
      }
    } catch (error) {
      console.error('2FA verification failed:', error);
      throw error;
    }
  }

  public async verify2FALogin(twoFactorToken: string, code: string): Promise<User> {
    return this.verifyTwoFactor(twoFactorToken, code);
  }

  public async register(userData: RegisterRequest): Promise<User> {
    try {
      const response = await api.post('/auth/register', userData);
      
      console.log('Register response:', response);
      
      const user = (response as any).user;
      
      if (user) {
        return user;
      } else {
        throw new Error('Invalid response format: missing user data');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await api.post('/oauth/logout', {});
      disconnectSocket();
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'https://accounts.google.com/logout';
      document.body.appendChild(iframe);
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      api.clearAuthToken();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.currentUser = null;
      this.notifyAuthChange();
      
      console.log('🔓 Logout completed, all sessions cleared');
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    if (!api.getAuthToken()) {
      return null;
    }

    try {
      const response = await api.get('/auth/me');
      const user = (response as any).user || response;
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      api.clearAuthToken();
      this.currentUser = null;
      return null;
    }
  }

  public async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response: ApiResponse<User> = await api.put('/auth/profile', userData);
      this.currentUser = response.data;
      this.notifyAuthChange();
      return response.data;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  public async resetPassword(email: string): Promise<void> {
    try {
      await api.post('/auth/reset-password', { email });
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  public async handleOAuthToken(token: string, userData: any): Promise<void> {
    try {
      api.setAuthToken(token);
      
      this.currentUser = {
        id: userData.id,
        username: userData.username || userData.display_name,
        email: userData.email,
        display_name: userData.display_name,
        avatar: userData.avatar
      };
      
      localStorage.setItem('user', JSON.stringify(this.currentUser));
      
      this.notifyAuthChange();
      
      console.log('OAuth token processed successfully');
    } catch (error) {
      console.error('Failed to handle OAuth token:', error);
      throw error;
    }
  }

  public isAuthenticated(): boolean {
    return !!api.getAuthToken() && !!this.currentUser;
  }

  public getUser(): User | null {
    return this.currentUser;
  }

  public async initialize(): Promise<void> {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token) {
      api.setAuthToken(token);
      if (userData) {
        try {
          this.currentUser = JSON.parse(userData);
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
        }
      }
      await this.getCurrentUser();
    }
  }

  private authChangeListeners: Array<(user: User | null) => void> = [];

  public onAuthChange(callback: (user: User | null) => void): void {
    this.authChangeListeners.push(callback);
  }

  public offAuthChange(callback: (user: User | null) => void): void {
    const index = this.authChangeListeners.indexOf(callback);
    if (index > -1) {
      this.authChangeListeners.splice(index, 1);
    }
  }

  private notifyAuthChange(): void {
    this.authChangeListeners.forEach(callback => {
      callback(this.currentUser);
    });
  }
}

export const authService = new AuthService();
