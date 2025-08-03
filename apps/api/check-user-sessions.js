const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserSessions() {
  try {
    console.log('🔍 Checking sessions for apizarrocotes@outlook.es...');
    
    // Find the user first
    const user = await prisma.user.findUnique({
      where: {
        email: 'apizarrocotes@outlook.es'
      }
    });
    
    if (!user) {
      console.log('❌ User apizarrocotes@outlook.es not found in database');
      
      // Show all users to help debug
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });
      
      console.log('\n👥 All users in database:');
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.name}) - ID: ${u.id}`);
      });
      
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email}) - ID: ${user.id}`);
    
    // Check recent sessions for this user (last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const recentSessions = await prisma.userSessionAnalytics.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: twoHoursAgo
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });
    
    console.log(`\n🔄 Found ${recentSessions.length} recent sessions (last 2 hours):`);
    
    if (recentSessions.length === 0) {
      console.log('❌ No recent sessions found for this user');
    } else {
      recentSessions.forEach(session => {
        const timeAgo = Math.floor((Date.now() - session.startTime.getTime()) / 1000 / 60); // minutes ago
        console.log(`  - Session ${session.sessionId} - ${timeAgo} min ago`);
        console.log(`    Device: ${session.deviceType}, Browser: ${session.browser}, OS: ${session.os}`);
        console.log(`    Duration: ${session.duration} seconds, IP: ${session.ipAddress}`);
      });
    }
    
    // Check ALL sessions for this user
    const allSessions = await prisma.userSessionAnalytics.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 10
    });
    
    console.log(`\n📊 Total sessions for this user: ${allSessions.length}`);
    if (allSessions.length > 0) {
      console.log('Last 5 sessions:');
      allSessions.slice(0, 5).forEach(session => {
        const date = session.startTime.toLocaleDateString();
        const time = session.startTime.toLocaleTimeString();
        console.log(`  - ${date} ${time} - ${session.deviceType} (${session.duration}s)`);
      });
    }
    
    // Check today's analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAnalytics = await prisma.platformAnalytics.findFirst({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });
    
    console.log('\n📈 Today\'s platform analytics:');
    if (todayAnalytics) {
      console.log(`  DAU: ${todayAnalytics.dailyActiveUsers}, Sessions: ${todayAnalytics.totalSessions}`);
    } else {
      console.log('  No analytics data for today');
    }
    
  } catch (error) {
    console.error('❌ Error checking user sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSessions();