import { initGlobalSocket, socket } from '@/socket/client';
import { Config } from '../config';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

export class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || Config.API_BASE_URL;
    console.log('[API] Using base URL:', this.baseUrl);
    Config.logConfig();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getHeaders(): Record<string, string> {
    const headers = { ...this.defaultHeaders };
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    console.log('[API] Making request to:', url);
    console.log('[API] Request headers:', config.headers);
    console.log('[API] Request options:', config);

    try {
      const response = await fetch(url, config);
      console.log('[API] Response status:', response.status);
      console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error('[API] Response not OK, status:', response.status);
        let errorData;
        try {
          errorData = await response.json();
          console.error('[API] Error data:', errorData);
        } catch {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      console.log('[API] Response text:', text);
      const data = text ? JSON.parse(text) : null;
      console.log('[API] Parsed response data:', data);
      
      return data as ApiResponse<T>;
    } catch (error) {
      console.error('[API] Request failed:', error);
      throw error;
    }
  }

  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  public async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  public async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async uploadFile<T>(
    endpoint: string, 
    file: File, 
    fieldName: string = 'file'
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        ...this.getHeaders(),
        'Content-Type': undefined as any,
      },
    });
  }

  public async getCurrentUser(): Promise<ApiResponse<{ user: any }>> {
    console.log('🌐 API Service: getCurrentUser çağrılıyor...');
    const result = await this.request('/users/me');
    console.log('🌐 API Service getCurrentUser response:', result);
    return result as ApiResponse<{ user: any }>;
  }

  public async searchUsers(query: string): Promise<ApiResponse<{ users: any[] }>> {
    return this.request(`/users/search?q=${encodeURIComponent(query)}`);
  }

  public async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string; message: string }>> {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Sadece PNG, JPG ve JPEG dosyaları desteklenmektedir.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Dosya boyutu çok büyük (maksimum 5MB).');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          const response = await this.request<{ avatarUrl: string; message: string }>('/users/avatar', {
            method: 'POST',
            body: JSON.stringify({ avatar: base64Data }),
          });
          
          resolve(response);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Dosya okunamadı.'));
      reader.readAsDataURL(file);
    });
  }

  public async updateAvatarUrl(avatarUrl: string): Promise<ApiResponse<{ avatarUrl: string; user: any }>> {
    return this.request('/upload/avatar-url', {
      method: 'PUT',
      body: JSON.stringify({ avatarUrl }),
    });
  }

  public async deleteAvatar(): Promise<ApiResponse<{ user: any }>> {
    return this.request('/upload/avatar-url', {
      method: 'PUT',
      body: JSON.stringify({ avatarUrl: null }),
    });
  }

  public async getAllUsers(): Promise<ApiResponse<{ users: any[] }>> {
    console.log('🌐 API Service: getAllUsers çağrılıyor...');
    const result = await this.request('/users');
    console.log('🌐 API Service response:', result);
    return result as ApiResponse<{ users: any[] }>;
  }

  public async addFriend(friendId: number): Promise<ApiResponse> {
    return this.request(`/friends/add/${friendId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({})
      
    });
  }

  public async getFriends(): Promise<ApiResponse<{ friends: any[] }>> {
    return this.request('/friends/friends');
  }

  public async getFriendRequests(): Promise<ApiResponse<{ requests: any[] }>> {
    return this.request(`/friends/requests`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
    });  }

  public async acceptFriendRequest(userId: number): Promise<ApiResponse> {
    return this.request(`/friends/accept/${userId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({})
    });
  }

  public async removeFriend(friendId: number): Promise<ApiResponse> {
    return await this.request(`/friends/remove/${friendId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
    });
  }

  public async blockUser(userId: number): Promise<ApiResponse> {
    return this.request(`/friends/block/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({})
    });
  }

  public setAuthToken(token: string): void {
    localStorage.setItem('token', token);
  }

  public getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  public clearAuthToken(): void {
    localStorage.removeItem('token');
  }

  public async updateUser(data: { display_name?: string; email?: string }): Promise<ApiResponse<{ user: any; message: string }>> {
    return this.request('/users', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  public async deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/users/delete-account', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  public async get2FAStatus(): Promise<ApiResponse<{ enabled: boolean }>> {
    return this.request('/auth/2fa/status');
  }

  public async setup2FA(): Promise<ApiResponse<{ qr: string; secret: string }>> {
    return this.request('/auth/2fa/setup');
  }

  public async verify2FASetup(token: string): Promise<ApiResponse<{ message: string; recoveryCodes: string[] }>> {
    return this.request('/auth/2fa/verify-setup', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  public async verify2FALogin(twoFactorToken: string, code: string): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth/2fa/login', {
      method: 'POST',
      body: JSON.stringify({ twoFactorToken, code }),
    });
  }

  public async disable2FA(): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  public async getMatchHistory(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    return this.request(`/users/match-history?page=${page}&limit=${limit}`);
  }

  public async getGameStats(): Promise<ApiResponse<any>> {
    return this.request('/users/game-stats');
  }
}

export const api = new ApiService();
