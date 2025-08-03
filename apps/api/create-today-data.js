const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTodayData() {
  try {
    console.log('🎯 Creating analytics data specifically for TODAY...');
    
    // Use local date without timezone confusion
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const today = new Date(todayStr + 'T00:00:00.000Z');
    
    console.log(`📅 Working with date: ${todayStr}`);
    console.log(`📅 Date object: ${today.toISOString()}`);
    
    // Delete existing data for today
    await prisma.platformAnalytics.deleteMany({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });
    
    await prisma.userSessionAnalytics.deleteMany({
      where: {
        startTime: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });
    
    console.log('🗑️  Cleaned existing data for today');
    
    // Get existing users
    const users = await prisma.user.findMany({ take: 3 });
    console.log(`👥 Found ${users.length} users`);
    
    // Create fresh sessions for TODAY
    const sessions = [];
    const sessionCount = 6;
    
    for (let i = 0; i < sessionCount; i++) {
      // Create random time within today
      const randomTimeToday = new Date(today.getTime() + Math.random() * (23 * 60 * 60 * 1000)); // 0-23 hours into today
      const duration = Math.floor(Math.random() * 1800) + 300; // 5-35 minutes
      const endTime = new Date(randomTimeToday.getTime() + duration * 1000);
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      const sessionData = {
        userId: randomUser.id,
        sessionId: `session_today_${Date.now()}_${i}`,
        startTime: randomTimeToday,
        endTime: endTime,
        duration: duration,
        deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
        browser: ['chrome', 'firefox', 'safari', 'edge'][Math.floor(Math.random() * 4)],
        os: ['windows', 'macos', 'linux', 'ios', 'android'][Math.floor(Math.random() * 5)],
        country: 'Spain',
        countryCode: 'ES',
        ipAddress: '192.168.1.' + (Math.floor(Math.random() * 254) + 1),
        userAgent: 'Mozilla/5.0 (Test Browser)',
        interactions: Math.floor(Math.random() * 20) + 1,
        pageViews: Math.floor(Math.random() * 10) + 1
      };
      
      sessions.push(sessionData);
      
      await prisma.userSessionAnalytics.create({
        data: sessionData
      });
      
      console.log(`✅ Created session at ${randomTimeToday.toLocaleTimeString()}`);
    }
    
    // Create platform analytics for today
    const uniqueUsers = new Set(sessions.map(s => s.userId)).size;
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const avgDuration = Math.floor(totalDuration / sessionCount);
    
    const platformData = {
      date: today,
      dailyActiveUsers: uniqueUsers,
      monthlyActiveUsers: uniqueUsers + 3, // Fake MAU
      totalSessions: sessionCount,
      totalRevenue: 0,
      avgSessionLength: avgDuration,
      newUsers: Math.floor(uniqueUsers / 2),
      returningUsers: Math.ceil(uniqueUsers / 2)
    };
    
    await prisma.platformAnalytics.create({
      data: platformData
    });
    
    console.log('📊 Created platform analytics for today');
    
    // Verify data
    console.log('\n✅ VERIFICATION:');
    console.log(`📅 Date: ${todayStr}`);
    console.log(`👥 Daily Active Users: ${uniqueUsers}`);
    console.log(`🔄 Total Sessions: ${sessionCount}`);
    console.log(`⏱️  Average Session Duration: ${avgDuration} seconds (${Math.floor(avgDuration/60)} minutes)`);
    
    console.log('\n🎉 Fresh data created for TODAY successfully!');
    
  } catch (error) {
    console.error('❌ Error creating today data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTodayData();