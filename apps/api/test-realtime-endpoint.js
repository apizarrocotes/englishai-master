const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRealtimeEndpoint() {
  try {
    console.log('🧪 Testing realtime endpoint logic...');
    
    // Test the AnalyticsService getRecentSessions method directly
    const { AnalyticsService } = require('./dist/services/AnalyticsService');
    const analyticsService = AnalyticsService.getInstance();
    
    // Get recent sessions (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    console.log('Looking for sessions since:', thirtyMinutesAgo.toLocaleString());
    
    const recentSessions = await analyticsService.getRecentSessions(thirtyMinutesAgo);
    
    console.log(`\n📊 Found ${recentSessions.length} recent sessions:`);
    recentSessions.forEach(session => {
      const timeAgo = Math.floor((Date.now() - session.startTime.getTime()) / 1000 / 60);
      console.log(`  - ${session.userName} (${session.userId.slice(-8)}) - ${timeAgo} min ago`);
      console.log(`    Device: ${session.deviceType}, Browser: ${session.browser}, OS: ${session.os}`);
      console.log(`    IP: ${session.ipAddress}`);
    });
    
    // Transform to activity format
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
    
    console.log('\n🎯 Transformed activities:');
    recentActivities.forEach(activity => {
      const timeAgo = Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / 1000 / 60);
      console.log(`  - ${activity.userName}: ${activity.action} (${timeAgo} min ago)`);
    });
    
    // Test the full realtime data structure
    const metrics = await analyticsService.getDashboardMetrics('7d');
    
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
    
    console.log('\n📈 Complete realtime data:');
    console.log(JSON.stringify(realtimeData, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing realtime endpoint:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealtimeEndpoint();