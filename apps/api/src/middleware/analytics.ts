import { Request, Response, NextFunction } from 'express';
import { GeoLocationService, LocationData } from '../services/GeoLocationService';
import { AnalyticsService } from '../services/AnalyticsService';
import { logger } from '../utils/logger';
import UAParser from 'ua-parser-js';

interface AnalyticsRequest extends Request {
  analytics?: {
    location: LocationData | null;
    device: {
      type: 'desktop' | 'mobile' | 'tablet';
      browser: string;
      os: string;
    };
    sessionId: string;
    userId?: string;
  };
}

export const analyticsMiddleware = async (req: AnalyticsRequest, res: Response, next: NextFunction) => {
  try {
    // Skip analytics for certain routes
    if (shouldSkipAnalytics(req.path)) {
      return next();
    }

    // Get user IP
    const ipAddress = GeoLocationService.extractIPFromRequest(req);
    
    // Get location data
    const geoService = GeoLocationService.getInstance();
    const location = await geoService.getLocationFromIP(ipAddress);
    
    // Parse user agent for device info
    const parser = new UAParser(req.headers['user-agent']);
    const deviceResult = parser.getResult();
    
    // Determine device type
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (deviceResult.device.type === 'mobile') {
      deviceType = 'mobile';
    } else if (deviceResult.device.type === 'tablet') {
      deviceType = 'tablet';
    }

    // Clean browser name
    const browser = cleanBrowserName(deviceResult.browser.name || 'other');
    const os = cleanOSName(deviceResult.os.name || 'other');

    // Generate or get session ID
    const sessionId = req.headers['x-session-id'] as string || 
                     req.session?.id || 
                     generateSessionId();

    // Get user ID from auth
    const userId = (req as any).user?.id;

    // Attach analytics data to request
    req.analytics = {
      location,
      device: {
        type: deviceType,
        browser,
        os
      },
      sessionId,
      userId
    };

    // Record session data asynchronously (don't block request)
    setImmediate(async () => {
      try {
        await recordSessionAnalytics(req.analytics!, ipAddress, req.path);
      } catch (error) {
        logger.error('Error recording session analytics:', error);
      }
    });

    next();
  } catch (error) {
    logger.error('Analytics middleware error:', error);
    // Don't block request if analytics fails
    next();
  }
};

/**
 * Record session analytics data
 */
async function recordSessionAnalytics(
  analytics: NonNullable<AnalyticsRequest['analytics']>, 
  ipAddress: string, 
  path: string
) {
  const analyticsService = AnalyticsService.getInstance();
  
  // Record session start/activity
  await analyticsService.recordUserSession({
    sessionId: analytics.sessionId,
    userId: analytics.userId,
    ipAddress,
    userAgent: '',
    location: analytics.location,
    device: analytics.device,
    startTime: new Date(),
    lastActivity: new Date(),
    path
  });

  // Update daily analytics
  if (analytics.location) {
    await analyticsService.updateDailyAnalytics({
      date: new Date(),
      location: analytics.location,
      device: analytics.device,
      userId: analytics.userId,
      sessionId: analytics.sessionId
    });
  }
}

/**
 * Check if we should skip analytics for this path
 */
function shouldSkipAnalytics(path: string): boolean {
  const skipPaths = [
    '/health',
    '/favicon.ico',
    '/_next/',
    '/api/auth/',
    '/api/analytics/', // Don't track analytics API calls
    '/static/',
    '/robots.txt',
    '/sitemap.xml'
  ];

  return skipPaths.some(skipPath => path.startsWith(skipPath));
}

/**
 * Clean browser name for consistency
 */
function cleanBrowserName(browser: string): string {
  const browserMap: Record<string, string> = {
    'Chrome': 'chrome',
    'Firefox': 'firefox',
    'Safari': 'safari',
    'Edge': 'edge',
    'Internet Explorer': 'edge',
    'Opera': 'chrome', // Group with chrome for analytics
    'Samsung Internet': 'chrome' // Group with chrome
  };

  const normalized = Object.keys(browserMap).find(key => 
    browser.toLowerCase().includes(key.toLowerCase())
  );

  return normalized ? browserMap[normalized] : 'other';
}

/**
 * Clean OS name for consistency
 */
function cleanOSName(os: string): string {
  const osMap: Record<string, string> = {
    'Windows': 'windows',
    'Mac OS': 'macos',
    'macOS': 'macos',
    'Linux': 'linux',
    'iOS': 'ios',
    'Android': 'android',
    'Ubuntu': 'linux',
    'Debian': 'linux',
    'CentOS': 'linux'
  };

  const normalized = Object.keys(osMap).find(key => 
    os.toLowerCase().includes(key.toLowerCase())
  );

  return normalized ? osMap[normalized] : 'other';
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default analyticsMiddleware;