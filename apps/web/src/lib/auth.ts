// Auto-detect API URL based on current environment
const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // If running in browser, try to detect the correct URL
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    } else {
      return `http://${hostname}:3001`;
    }
  }
  
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  subscriptionTier: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  tokens: AuthTokens;
}

class AuthAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        mode: 'cors',
        credentials: 'include',
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('API Error:', { url, status: response.status, error: errorData });
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('Request failed:', { 
        url, 
        error, 
        apiUrl: API_URL,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'server-side'
      });
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
        throw new Error(
          `No se puede conectar con el servidor en ${API_URL}. ` +
          `Accediendo desde: ${hostname}. ` +
          `Verifica que el API esté ejecutándose y sea accesible.`
        );
      }
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async refreshToken(refreshToken: string): Promise<{ success: boolean; tokens: AuthTokens }> {
    return this.request<{ success: boolean; tokens: AuthTokens }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getCurrentUser(accessToken: string): Promise<{ success: boolean; user: User }> {
    return this.request<{ success: boolean; user: User }>('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async logout(accessToken?: string): Promise<{ success: boolean; message: string }> {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return this.request<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
      headers,
    });
  }

  async googleCallback(token: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/callback/google', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async microsoftCallback(token: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/callback/microsoft', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }
}

export const authAPI = new AuthAPI();

// Token storage utilities
export class TokenStorage {
  private static ACCESS_TOKEN_KEY = 'auth_access_token';
  private static REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private static EXPIRES_AT_KEY = 'auth_expires_at';

  static setTokens(tokens: AuthTokens) {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    
    // Handle both Date objects and string dates
    const expiresAtString = tokens.expiresAt instanceof Date 
      ? tokens.expiresAt.toISOString()
      : typeof tokens.expiresAt === 'string' 
        ? tokens.expiresAt
        : new Date(tokens.expiresAt).toISOString();
        
    localStorage.setItem(this.EXPIRES_AT_KEY, expiresAtString);
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getExpiresAt(): Date | null {
    if (typeof window === 'undefined') return null;
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    return expiresAt ? new Date(expiresAt) : null;
  }

  static isTokenExpired(): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return true;
    
    // Add a small buffer (30 seconds) to prevent edge cases
    const bufferTime = 30 * 1000; // 30 seconds in milliseconds
    return new Date().getTime() >= (expiresAt.getTime() - bufferTime);
  }

  static clearTokens() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  static hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }

  static clearCorruptedTokens() {
    try {
      const expiresAtString = localStorage.getItem(this.EXPIRES_AT_KEY);
      if (expiresAtString) {
        const expiresAt = new Date(expiresAtString);
        if (isNaN(expiresAt.getTime())) {
          // Invalid date, clear all tokens
          this.clearTokens();
          console.warn('Cleared corrupted tokens from localStorage');
        }
      }
    } catch (error) {
      console.error('Error checking token corruption:', error);
      this.clearTokens();
    }
  }
}

// Auth hook utilities
export class AuthUtils {
  static async tryRefreshToken(): Promise<AuthTokens | null> {
    const refreshToken = TokenStorage.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await authAPI.refreshToken(refreshToken);
      TokenStorage.setTokens(response.tokens);
      return response.tokens;
    } catch (error) {
      // Refresh token is invalid, clear storage
      TokenStorage.clearTokens();
      return null;
    }
  }

  static async getValidAccessToken(): Promise<string | null> {
    const accessToken = TokenStorage.getAccessToken();
    
    if (!accessToken) return null;
    
    // If token is not expired, return it
    if (!TokenStorage.isTokenExpired()) {
      return accessToken;
    }

    // Try to refresh the token
    const newTokens = await this.tryRefreshToken();
    return newTokens?.accessToken || null;
  }

  static async getCurrentUser(): Promise<User | null> {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return null;

    try {
      const response = await authAPI.getCurrentUser(accessToken);
      return response.user;
    } catch (error) {
      // Token might be invalid, clear storage
      TokenStorage.clearTokens();
      return null;
    }
  }

  static async logout(): Promise<void> {
    const accessToken = TokenStorage.getAccessToken();
    
    try {
      if (accessToken) {
        await authAPI.logout(accessToken);
      }
    } catch (error) {
      // Ignore logout errors
      console.warn('Logout API call failed:', error);
    } finally {
      TokenStorage.clearTokens();
    }
  }
}