import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import { createError } from './errorHandler';
import { logger } from '@/utils/logger';

const authService = new AuthService();

// Extend Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Authentication middleware that verifies JWT tokens
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Enhanced logging for development
    logger.info('Auth middleware - processing request', {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? `${authHeader.substring(0, 20)}...` : 'none',
      ip: req.ip
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.error('Auth middleware - missing or invalid authorization header', {
        authHeader: authHeader || 'missing',
        path: req.path,
        method: req.method
      });
      throw createError('Authorization token required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Enhanced logging for token verification
    logger.info('Auth middleware - attempting token verification', {
      tokenLength: token.length,
      tokenPreview: `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
      path: req.path,
      method: req.method
    });
    
    // Verify token and get user ID
    const userId = await authService.verifyToken(token);
    
    // Add userId to request object
    req.userId = userId;
    
    logger.info('User authenticated successfully', { 
      userId, 
      path: req.path,
      method: req.method,
      tokenPreview: `${token.substring(0, 10)}...`
    });
    
    next();
  } catch (error) {
    logger.error('Authentication failed - detailed error', { 
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      path: req.path,
      method: req.method,
      ip: req.ip,
      authHeader: req.headers.authorization ? `${req.headers.authorization.substring(0, 30)}...` : 'missing'
    });
    
    if ((error as any).statusCode) {
      next(error);
    } else {
      next(createError('Invalid or expired token', 401));
    }
  }
};

/**
 * Optional authentication middleware - sets userId if token is valid but doesn't fail if not
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const userId = await authService.verifyToken(token);
      req.userId = userId;
    }
    
    next();
  } catch (error) {
    // Optional auth - continue without setting userId
    next();
  }
};