import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import { AnalyticsService } from '@/services/AnalyticsService';
import { createError } from './errorHandler';
import { logger } from '@/utils/logger';

const authService = new AuthService();
const analyticsService = AnalyticsService.getInstance();

// Helper function to extract device/browser info from User-Agent
const extractDeviceInfo = (userAgent: string) => {
  const ua = userAgent.toLowerCase();
  
  // Device type detection
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/.test(ua)) {
    deviceType = /ipad/.test(ua) ? 'tablet' : 'mobile';
  } else if (/tablet/.test(ua)) {
    deviceType = 'tablet';
  }
  
  // Browser detection
  let browser = 'other';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'chrome';
  else if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari';
  else if (ua.includes('edg')) browser = 'edge';
  
  // OS detection
  let os = 'unknown';
  if (ua.includes('windows')) os = 'windows';
  else if (ua.includes('mac os')) os = 'macos';
  else if (ua.includes('linux')) os = 'linux';
  else if (ua.includes('ios')) os = 'ios';
  else if (ua.includes('android')) os = 'android';
  
  return { deviceType, browser, os };
};

// Session tracking cache to avoid duplicate session creation
const sessionCache = new Map<string, { sessionId: string; lastActivity: number }>();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Track user session for analytics
const trackUserSession = async (req: Request, userId: string): Promise<void> => {
  try {
    const now = Date.now();
    const userKey = `${userId}-${req.ip}`;
    const cachedSession = sessionCache.get(userKey);
    
    // Check if we have a valid existing session (within timeout)
    if (cachedSession && (now - cachedSession.lastActivity) < SESSION_TIMEOUT) {
      // Update existing session activity
      cachedSession.lastActivity = now;
      req.sessionId = cachedSession.sessionId;
      return;
    }
    
    // Create new session
    const sessionId = `session_${userId}_${now}`;
    const userAgent = req.headers['user-agent'] || '';
    const deviceInfo = extractDeviceInfo(userAgent);
    
    // Store session info
    sessionCache.set(userKey, {
      sessionId,
      lastActivity: now
    });
    
    req.sessionId = sessionId;
    
    // Record session in analytics
    await analyticsService.recordUserSession({
      userId,
      sessionId,
      startTime: new Date(),
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      country: 'Unknown', // Could be enhanced with GeoIP
      countryCode: 'XX',
      ipAddress: req.ip || 'unknown',
      userAgent
    });
    
    logger.info('New user session tracked', {
      userId,
      sessionId,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ip: req.ip
    });
    
  } catch (error) {
    logger.error('Error tracking user session:', error);
    // Don't throw - session tracking should not break authentication
  }
};

// Extend Request interface to include userId and session tracking
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
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
    
    // Track user session for analytics
    await trackUserSession(req, userId);
    
    logger.info('User authenticated successfully', { 
      userId, 
      path: req.path,
      method: req.method,
      tokenPreview: `${token.substring(0, 10)}...`,
      sessionId: req.sessionId
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
      
      // Track user session for analytics (optional auth)
      await trackUserSession(req, userId);
    }
    
    next();
  } catch (error) {
    // Optional auth - continue without setting userId
    next();
  }
};

/**
 * Middleware to track session activity and cleanup
 */
export const sessionTracker = (req: Request, res: Response, next: NextFunction) => {
  // Track session end when response finishes
  res.on('finish', async () => {
    if (req.userId && req.sessionId) {
      try {
        // Update session end time and basic activity
        await analyticsService.updateSessionEnd(
          req.sessionId,
          new Date(),
          1, // interactions count
          1  // page views count
        );
      } catch (error) {
        logger.error('Error updating session end:', error);
      }
    }
  });
  
  next();
};