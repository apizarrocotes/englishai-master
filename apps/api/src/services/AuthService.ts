import jwt from 'jsonwebtoken';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

export class AuthService {
  private jwtSecret: string;
  private refreshSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    this.refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret';
  }

  async verifyGoogleToken(token: string): Promise<any> {
    try {
      const response = await axios.get(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
      return response.data;
    } catch (error) {
      logger.error('Google token verification failed', { error: (error as Error).message });
      throw createError('Invalid Google token', 401);
    }
  }

  async verifyMicrosoftToken(token: string): Promise<any> {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      logger.error('Microsoft token verification failed', { error: (error as Error).message });
      throw createError('Invalid Microsoft token', 401);
    }
  }

  async verifyAppleToken(token: string): Promise<any> {
    // Apple token verification is more complex and requires Apple's public keys
    // This is a placeholder implementation
    try {
      // In production, implement proper Apple ID token verification
      // using Apple's public keys and JWT verification
      throw createError('Apple authentication not yet implemented', 501);
    } catch (error) {
      logger.error('Apple token verification failed', { error: (error as Error).message });
      throw createError('Invalid Apple token', 401);
    }
  }

  async generateTokens(userId: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const payload = { userId, type: 'access' };
    const refreshPayload = { userId, type: 'refresh' };

    const accessToken = jwt.sign(payload, this.jwtSecret, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    } as jwt.SignOptions);
    
    const refreshToken = jwt.sign(refreshPayload, this.refreshSecret, { 
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' 
    } as jwt.SignOptions);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    return { accessToken, refreshToken, expiresAt };
  }

  async verifyToken(token: string): Promise<string> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return decoded.userId;
    } catch (error) {
      throw createError('Invalid or expired token', 401);
    }
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret) as any;
      
      if (decoded.type !== 'refresh') {
        throw createError('Invalid refresh token', 401);
      }

      return this.generateTokens(decoded.userId);
    } catch (error) {
      throw createError('Invalid or expired refresh token', 401);
    }
  }

  async revokeToken(token: string): Promise<void> {
    // In a production environment, you'd typically add the token to a blacklist
    // For now, this is a placeholder
    logger.info('Token revoked', { token: token.substring(0, 20) + '...' });
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}