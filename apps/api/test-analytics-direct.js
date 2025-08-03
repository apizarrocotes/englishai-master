const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAnalytics() {
  try {
    console.log('🔍 Testing analytics data directly from database...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check platform analytics for today
    const platformAnalytics = await prisma.platformAnalytics.findFirst({
      where: {
        date: today
      }
    });
    
    console.log('📊 Platform Analytics for today:', platformAnalytics);
    
    // Check user sessions for today
    const sessions = await prisma.userSessionAnalytics.findMany({
      where: {
        startTime: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });
    
    console.log(`🔄 Found ${sessions.length} user sessions for today:`);
    sessions.forEach(session => {
      console.log(`  - Session ${session.sessionId.substring(0, 20)}... by user ${session.userId} (${session.deviceType}, ${session.browser})`);
    });
    
    // Test analytics service directly
    const { AnalyticsService } = require('./src/services/AnalyticsService');
    const analyticsService = AnalyticsService.getInstance();
    
    console.log('\n🧪 Testing AnalyticsService directly...');
    
    const metrics = await analyticsService.getDashboardMetrics('1d');
    console.log('📈 Dashboard metrics (1d):', JSON.stringify(metrics, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing analytics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalytics();