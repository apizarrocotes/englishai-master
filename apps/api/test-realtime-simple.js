const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRealtimeLogic() {
  try {
    console.log('🧪 Testing realtime endpoint logic...');
    
    // Simulate the /realtime endpoint logic
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    console.log('Looking for sessions since:', thirtyMinutesAgo.toLocaleString());
    
    // Get recent sessions (this is what the new endpoint does)
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
    
    console.log(`📊 Found ${recentSessions.length} recent sessions`);
    
    // Transform sessions to activities (exactly like the endpoint)
    const recentActivities = recentSessions.map(session => ({
      id: session.sessionId,
      userId: session.userId,
      userName: session.userName || session.user?.name || `User ${session.userId.slice(-4)}`,
      action: 'session_start',
      timestamp: session.startTime.toISOString(),
      metadata: {
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        ipAddress: session.ipAddress
      }
    }));
    
    // Mock metrics
    const metrics = {
      dailyActiveUsers: 2,
      totalSessions: 6
    };
    
    // Build the realtime data structure
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
    
    console.log('\n🎯 Final realtime data structure:');
    console.log('Active Users:', realtimeData.activeUsers);
    console.log('Current Sessions:', realtimeData.currentSessions);
    console.log('Recent Activities:', realtimeData.recentActivities.length);
    
    console.log('\n📋 Recent Activities Details:');
    realtimeData.recentActivities.forEach((activity, i) => {
      const timeAgo = Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / 1000 / 60);
      console.log(`${i + 1}. ${activity.userName}: ${activity.action} (${timeAgo} min ago)`);
      console.log(`   ${activity.metadata.deviceType} • ${activity.metadata.browser} • ${activity.metadata.os}`);
    });
    
    console.log('\n✅ This data should appear in the dashboard Recent Activity section!');
    
    // Show the exact JSON that would be returned
    const apiResponse = {
      success: true,
      data: realtimeData,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n📨 Complete API Response:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing realtime logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealtimeLogic();