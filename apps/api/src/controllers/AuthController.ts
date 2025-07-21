import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import { UserService } from '@/services/UserService';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      
      // Verify Google token and get user info
      const googleUser = await this.authService.verifyGoogleToken(token);
      
      // Create or update user in our database
      const user = await this.userService.createOrUpdateUser({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        provider: 'google',
        providerId: googleUser.sub,
      });

      // Generate JWT tokens
      const tokens = await this.authService.generateTokens(user.id);

      logger.info('Google auth successful', { userId: user.id, email: user.email });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        tokens,
      });
    } catch (error) {
      logger.error('Google auth failed', { error: (error as Error).message });
      next(createError('Google authentication failed', 401));
    }
  };

  microsoftCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      
      // Verify Microsoft token and get user info
      const microsoftUser = await this.authService.verifyMicrosoftToken(token);
      
      // Create or update user in our database
      const user = await this.userService.createOrUpdateUser({
        email: microsoftUser.mail || microsoftUser.userPrincipalName,
        name: microsoftUser.displayName,
        avatarUrl: undefined, // Microsoft Graph API requires separate call for photo
        provider: 'microsoft',
        providerId: microsoftUser.id,
      });

      // Generate JWT tokens
      const tokens = await this.authService.generateTokens(user.id);

      logger.info('Microsoft auth successful', { userId: user.id, email: user.email });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        tokens,
      });
    } catch (error) {
      logger.error('Microsoft auth failed', { error: (error as Error).message });
      next(createError('Microsoft authentication failed', 401));
    }
  };

  appleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      
      // Verify Apple token and get user info
      const appleUser = await this.authService.verifyAppleToken(token);
      
      // Create or update user in our database
      const user = await this.userService.createOrUpdateUser({
        email: appleUser.email,
        name: appleUser.name || 'Apple User',
        avatarUrl: undefined,
        provider: 'apple',
        providerId: appleUser.sub,
      });

      // Generate JWT tokens
      const tokens = await this.authService.generateTokens(user.id);

      logger.info('Apple auth successful', { userId: user.id, email: user.email });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        tokens,
      });
    } catch (error) {
      logger.error('Apple auth failed', { error: (error as Error).message });
      next(createError('Apple authentication failed', 401));
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      
      const tokens = await this.authService.refreshTokens(refreshToken);
      
      res.json({
        success: true,
        tokens,
      });
    } catch (error) {
      logger.error('Token refresh failed', { error: (error as Error).message });
      next(createError('Invalid refresh token', 401));
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await this.authService.revokeToken(token);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Logout failed', { error: (error as Error).message });
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError('Authorization token required', 401);
      }

      const token = authHeader.substring(7);
      const userId = await this.authService.verifyToken(token);
      const user = await this.userService.getUserById(userId);

      if (!user) {
        throw createError('User not found', 404);
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          subscriptionTier: user.subscriptionTier,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;

      // Validate email format
      if (!this.authService.validateEmail(email)) {
        throw createError('Invalid email format', 400);
      }

      // Validate password strength
      const passwordValidation = this.authService.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw createError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
      }

      // Check if user already exists
      const existingUser = await this.userService.getUserByEmail(email);
      if (existingUser) {
        throw createError('User with this email already exists', 409);
      }

      // Hash password
      const hashedPassword = await this.authService.hashPassword(password);

      // Create user
      const user = await this.userService.createUser({
        email,
        name,
        password: hashedPassword,
        provider: 'email',
      });

      // Generate tokens
      const tokens = await this.authService.generateTokens(user.id);

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        tokens,
      });
    } catch (error) {
      logger.error('Registration failed', { error: (error as Error).message });
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        throw createError('Email and password are required', 400);
      }

      if (!this.authService.validateEmail(email)) {
        throw createError('Invalid email format', 400);
      }

      // Find user by email
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        throw createError('Invalid credentials', 401);
      }

      // For OAuth users, password login is not allowed
      if (user.provider !== 'email' || !user.password) {
        throw createError('Please use your OAuth provider to sign in', 400);
      }

      // Verify password
      const isPasswordValid = await this.authService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw createError('Invalid credentials', 401);
      }

      // Generate tokens
      const tokens = await this.authService.generateTokens(user.id);

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          subscriptionTier: user.subscriptionTier,
        },
        tokens,
      });
    } catch (error) {
      logger.error('Login failed', { error: (error as Error).message, email: req.body?.email });
      next(error);
    }
  };
}