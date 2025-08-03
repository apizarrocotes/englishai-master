const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// Mock the AnalyticsService for testing
class TestAnalyticsService {
  static getInstance() {
    return new TestAnalyticsService();
  }

  async getDashboardMetrics(timeRange) {
    return {
      dailyActiveUsers: 2,
      monthlyActiveUsers: 4,
      totalSessions: 6,
      totalRevenue: 0,
      avgSessionLength: 1200,
      newUsers: 1,
      returningUsers: 1,
      changePercentage: {
        dau: 0,
        mau: 0,
        sessions: 0,
        revenue: 0
      }
    };
  }

  async getRecentSessions(since) {
    try {
      const sessions = await prisma.userSessionAnalytics.findMany({
        where: {
          startTime: {
            gte: since
          }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          startTime: 'desc'
        },
        take: 20
      });

      return sessions.map(session => ({
        sessionId: session.sessionId,
        userId: session.userId,
        userName: session.user?.name,
        startTime: session.startTime,
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        ipAddress: session.ipAddress
      }));
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      return [];
    }
  }
}

app.use(express.json());

// Test realtime endpoint
app.get('/api/analytics/realtime', async (req, res) => {
  try {
    console.log('🔄 Testing /realtime endpoint...');
    
    const analyticsService = TestAnalyticsService.getInstance();
    
    // Get current real-time metrics
    const metrics = await analyticsService.getDashboardMetrics('7d');
    
    // Get recent activities from user sessions (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentSessions = await analyticsService.getRecentSessions(thirtyMinutesAgo);
    
    console.log(`📊 Found ${recentSessions.length} recent sessions`);
    
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
      currentSessions: Math.floor(metrics.totalSessions * 0.1),
      systemHealth: {
        status: 'healthy',
        uptime: 99.8,
        responseTime: 120
      },
      recentActivities
    };

    console.log('✅ Returning realtime data:', JSON.stringify(realtimeData, null, 2));

    res.json({
      success: true,
      data: realtimeData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /realtime endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch real-time metrics',
      message: error.message
    });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/api/analytics/realtime`);
});

// Auto-shutdown after 2 minutes
setTimeout(() => {
  console.log('🔚 Test server shutting down...');
  prisma.$disconnect();
  process.exit(0);
}, 120000);