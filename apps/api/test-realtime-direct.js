const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRealtimeDirect() {
  try {
    console.log('🧪 Testing realtime logic directly with Prisma...');
    
    // Get recent sessions directly from database (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    console.log('Looking for sessions since:', thirtyMinutesAgo.toLocaleString());
    
    const recentSessions = await prisma.userSessionAnalytics.findMany({
      where: {
        startTime: {
          gte: thirtyMinutesAgo
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
    
    console.log(`\n📊 Found ${recentSessions.length} recent sessions:`);
    recentSessions.forEach(session => {
      const timeAgo = Math.floor((Date.now() - session.startTime.getTime()) / 1000 / 60);
      console.log(`  - ${session.user?.name} (${session.userId.slice(-8)}) - ${timeAgo} min ago`);
      console.log(`    Device: ${session.deviceType}, Browser: ${session.browser}, OS: ${session.os}`);
      console.log(`    Session ID: ${session.sessionId}`);
    });
    
    // Transform to activity format like the frontend expects
    const recentActivities = recentSessions.map(session => ({
      id: session.sessionId,
      userId: session.userId,
      userName: session.user?.name || `User ${session.userId.slice(-4)}`,
      action: 'session_start',
      timestamp: session.startTime.toISOString(),
      metadata: {
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        ipAddress: session.ipAddress
      }
    }));
    
    console.log('\n🎯 Activities that should appear in dashboard:');
    recentActivities.forEach(activity => {
      const timeAgo = Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / 1000 / 60);
      console.log(`  - ${activity.userName}: ${activity.action} (${timeAgo} min ago)`);
      console.log(`    ${activity.metadata.deviceType} • ${activity.metadata.browser} • ${activity.metadata.os}`);
    });
    
    console.log('\n📋 This is what the /realtime endpoint should return in recentActivities:');
    console.log(JSON.stringify(recentActivities, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing realtime:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealtimeDirect();