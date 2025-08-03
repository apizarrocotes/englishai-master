const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateSessionData() {
  try {
    console.log('🎯 Generating sample session data for today...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const now = new Date();
    
    // Get existing users or create some test users
    let users = await prisma.user.findMany({ take: 5 });
    
    if (users.length === 0) {
      console.log('👥 Creating test users...');
      const testUsers = [];
      for (let i = 0; i < 3; i++) {
        testUsers.push({
          email: `testuser${i + 1}@example.com`,
          name: `Test User ${i + 1}`,
          password: 'hashedpassword123',
          subscriptionTier: 'free'
        });
      }
      
      for (const userData of testUsers) {
        const user = await prisma.user.create({ data: userData });
        users.push(user);
        console.log(`✅ Created user ${user.email}`);
      }
    }
    
    console.log(`👥 Found ${users.length} users for session generation`);
    
    // Generate some user sessions for today
    const sessions = [];
    for (let i = 0; i < Math.min(5, users.length * 2); i++) {
      const startTime = new Date(today.getTime() + Math.random() * (now.getTime() - today.getTime()));
      const endTime = new Date(startTime.getTime() + (Math.random() * 30 * 60 * 1000)); // 0-30 minutes
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      sessions.push({
        userId: randomUser.id,
        sessionId: `session_${Date.now()}_${i}`,
        startTime,
        endTime,
        duration: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
        deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
        browser: ['chrome', 'firefox', 'safari', 'edge'][Math.floor(Math.random() * 4)],
        os: ['windows', 'macos', 'linux', 'ios', 'android'][Math.floor(Math.random() * 5)],
        country: 'Spain',
        countryCode: 'ES',
        ipAddress: '192.168.1.' + (Math.floor(Math.random() * 254) + 1),
        userAgent: 'Mozilla/5.0 (Test Browser)',
        interactions: Math.floor(Math.random() * 20) + 1,
        pageViews: Math.floor(Math.random() * 10) + 1
      });
    }
    
    // Insert sessions
    for (const session of sessions) {
      await prisma.userSessionAnalytics.create({
        data: session
      });
      console.log(`✅ Created session ${session.sessionId}`);
    }
    
    // Now aggregate data for today
    console.log('📊 Aggregating platform analytics for today...');
    
    // Calculate metrics
    const sessionCount = sessions.length;
    const uniqueUsers = new Set(sessions.map(s => s.userId)).size;
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const avgDuration = Math.floor(totalDuration / sessionCount);
    
    // Check if platform analytics already exists for today
    const existingAnalytics = await prisma.platformAnalytics.findFirst({
      where: {
        date: today
      }
    });
    
    const analyticsData = {
      date: today,
      dailyActiveUsers: uniqueUsers,
      monthlyActiveUsers: uniqueUsers + 2, // Fake MAU
      totalSessions: sessionCount,
      totalRevenue: 0,
      avgSessionLength: avgDuration,
      newUsers: Math.floor(uniqueUsers / 2),
      returningUsers: Math.ceil(uniqueUsers / 2)
    };
    
    if (existingAnalytics) {
      await prisma.platformAnalytics.update({
        where: { id: existingAnalytics.id },
        data: analyticsData
      });
      console.log('📈 Updated existing platform analytics');
    } else {
      await prisma.platformAnalytics.create({
        data: analyticsData
      });
      console.log('📈 Created new platform analytics');
    }
    
    console.log('🎉 Sample data generated successfully!');
    console.log(`📊 Daily Active Users: ${uniqueUsers}`);
    console.log(`🔄 Total Sessions: ${sessionCount}`);
    console.log(`⏱️  Average Session Duration: ${avgDuration} seconds`);
    
  } catch (error) {
    console.error('❌ Error generating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateSessionData();