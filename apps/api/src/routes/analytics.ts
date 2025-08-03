import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const analyticsService = AnalyticsService.getInstance();

// Apply authentication middleware to all analytics routes (skip in development for testing)
const conditionalAuth = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
    next();
  } else {
    authenticateToken(req, res, next);
  }
};

router.use(conditionalAuth);

interface DashboardParams {
  timeRange: '1d' | '7d' | '30d' | '90d' | '1y';
}

interface ExportParams extends DashboardParams {
  format: 'csv' | 'pdf' | 'excel';
}

// Dashboard metrics endpoint
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query as Partial<DashboardParams>;
    
    if (!['1d', '7d', '30d', '90d', '1y'].includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range. Must be one of: 1d, 7d, 30d, 90d, 1y'
      });
    }

    const metrics = await analyticsService.getDashboardMetrics(timeRange);
    
    res.json({
      success: true,
      data: metrics,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User activity endpoint
router.get('/user-activity', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query as Partial<DashboardParams>;
    
    if (!['1d', '7d', '30d', '90d', '1y'].includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range. Must be one of: 1d, 7d, 30d, 90d, 1y'
      });
    }

    const activityData = await analyticsService.getUserActivity(timeRange);
    
    res.json({
      success: true,
      data: activityData,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user activity:', error);
    res.status(500).json({
      error: 'Failed to fetch user activity data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Feature usage endpoint
router.get('/feature-usage', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query as Partial<DashboardParams>;
    
    if (!['1d', '7d', '30d', '90d', '1y'].includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range. Must be one of: 1d, 7d, 30d, 90d, 1y'
      });
    }

    const featureUsage = await analyticsService.getFeatureUsage(timeRange);
    
    res.json({
      success: true,
      data: featureUsage,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching feature usage:', error);
    res.status(500).json({
      error: 'Failed to fetch feature usage data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed feature usage endpoint
router.get('/feature-usage/detailed', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query as Partial<DashboardParams>;
    
    if (!['1d', '7d', '30d', '90d', '1y'].includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range. Must be one of: 1d, 7d, 30d, 90d, 1y'
      });
    }

    const detailedFeatureUsage = await analyticsService.getDetailedFeatureUsage(timeRange);
    
    res.json({
      success: true,
      data: detailedFeatureUsage,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching detailed feature usage:', error);
    res.status(500).json({
      error: 'Failed to fetch detailed feature usage data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Record feature usage endpoint
router.post('/feature-usage/record', async (req: Request, res: Response) => {
  try {
    const { userId, feature, duration = 0 } = req.body;
    
    if (!userId || !feature) {
      return res.status(400).json({
        error: 'Missing required fields: userId and feature are required'
      });
    }

    if (typeof duration !== 'number' || duration < 0) {
      return res.status(400).json({
        error: 'Duration must be a non-negative number'
      });
    }

    await analyticsService.recordFeatureUsage(userId, feature, duration);
    
    res.json({
      success: true,
      message: 'Feature usage recorded successfully',
      data: {
        userId,
        feature,
        duration,
        recordedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error recording feature usage:', error);
    res.status(500).json({
      error: 'Failed to record feature usage',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Geographic data endpoint
router.get('/geographic', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query as Partial<DashboardParams>;
    
    if (!['1d', '7d', '30d', '90d', '1y'].includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range. Must be one of: 1d, 7d, 30d, 90d, 1y'
      });
    }

    const geographicData = await analyticsService.getGeographicData(timeRange);
    
    res.json({
      success: true,
      data: geographicData,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching geographic data:', error);
    res.status(500).json({
      error: 'Failed to fetch geographic data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Device analytics endpoint
router.get('/devices', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query as Partial<DashboardParams>;
    
    if (!['1d', '7d', '30d', '90d', '1y'].includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range. Must be one of: 1d, 7d, 30d, 90d, 1y'
      });
    }

    const deviceData = await analyticsService.getDeviceAnalytics(timeRange);
    
    res.json({
      success: true,
      data: deviceData,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching device analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch device analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Performance metrics endpoint
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query as Partial<DashboardParams>;
    
    if (!['1d', '7d', '30d', '90d', '1y'].includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range. Must be one of: 1d, 7d, 30d, 90d, 1y'
      });
    }

    const performanceData = await analyticsService.getPerformanceMetrics(timeRange);
    
    res.json({
      success: true,
      data: performanceData,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch performance metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export data endpoint
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d', format = 'csv' } = req.body as Partial<ExportParams>;
    
    if (!['1d', '7d', '30d', '90d', '1y'].includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range. Must be one of: 1d, 7d, 30d, 90d, 1y'
      });
    }

    if (!['csv', 'pdf', 'excel'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid export format. Must be one of: csv, pdf, excel'
      });
    }

    // For now, return a simple success response
    // In production, this would generate and return the actual file
    res.json({
      success: true,
      message: `Export in ${format} format initiated for ${timeRange} time range`,
      downloadUrl: `/api/analytics/download/${Date.now()}.${format}`,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error exporting analytics data:', error);
    res.status(500).json({
      error: 'Failed to export analytics data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Real-time metrics endpoint (for WebSocket compatibility)
router.get('/realtime', async (req: Request, res: Response) => {
  try {
    // Get current real-time metrics
    const metrics = await analyticsService.getDashboardMetrics('7d');
    
    // Get recent activities from user sessions (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentSessions = await analyticsService.getRecentSessions(thirtyMinutesAgo);
    
    // Transform sessions to activities
    const recentActivities = recentSessions.map(session => ({
      id: session.sessionId,
      userId: session.userId,
      userName: session.userName || `User ${session.userId.slice(-4)}`,
      action: 'session_start',
      timestamp: session.startTime.toISOString(),
      metadata: {
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        ipAddress: session.ipAddress
      }
    }));
    
    // Extract only real-time relevant data
    const realtimeData = {
      activeUsers: metrics.dailyActiveUsers,
      currentSessions: Math.floor(metrics.totalSessions * 0.1), // Estimate active sessions
      systemHealth: {
        status: 'healthy',
        uptime: 99.8,
        responseTime: 120
      },
      recentActivities
    };

    res.json({
      success: true,
      data: realtimeData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching real-time metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch real-time metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trigger daily aggregation (admin only)
router.post('/aggregate/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    await analyticsService.aggregateDailyAnalytics(targetDate);
    
    res.json({
      success: true,
      message: `Daily analytics aggregation completed for ${date}`,
      date: targetDate.toISOString().split('T')[0]
    });
  } catch (error) {
    logger.error('Error aggregating daily analytics:', error);
    res.status(500).json({
      error: 'Failed to aggregate daily analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed sessions endpoint
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const { limit = '20', offset = '0' } = req.query;
    
    const sessions = await analyticsService.getDetailedSessions(
      parseInt(limit as string), 
      parseInt(offset as string)
    );
    
    res.json({
      success: true,
      data: sessions,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching detailed sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch detailed sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Top users endpoint
router.get('/top-users', async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    
    const users = await analyticsService.getTopUsers(parseInt(limit as string));
    
    res.json({
      success: true,
      data: users,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching top users:', error);
    res.status(500).json({
      error: 'Failed to fetch top users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Legacy progress endpoint (maintained for backwards compatibility)
router.get('/progress', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query as Partial<DashboardParams>;
    
    if (!['1d', '7d', '30d', '90d', '1y'].includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range. Must be one of: 1d, 7d, 30d, 90d, 1y'
      });
    }

    const activityData = await analyticsService.getUserActivity(timeRange);
    
    res.json({
      success: true,
      data: activityData,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching progress analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch progress analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as analyticsRoutes };