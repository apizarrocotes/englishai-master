const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDates() {
  try {
    console.log('📅 Checking all dates in analytics data...');
    
    // Check platform analytics
    const platformData = await prisma.platformAnalytics.findMany({
      orderBy: { date: 'desc' },
      take: 5
    });
    
    console.log('\n📊 Platform Analytics dates:');
    platformData.forEach(data => {
      console.log(`  Date: ${data.date.toISOString().split('T')[0]} - DAU: ${data.dailyActiveUsers}, Sessions: ${data.totalSessions}`);
    });
    
    // Check session analytics
    const sessionData = await prisma.userSessionAnalytics.findMany({
      orderBy: { startTime: 'desc' },
      take: 10,
      select: {
        sessionId: true,
        startTime: true,
        userId: true,
        deviceType: true
      }
    });
    
    console.log('\n🔄 User Session dates:');
    sessionData.forEach(session => {
      const date = session.startTime.toISOString().split('T')[0];
      const time = session.startTime.toISOString().split('T')[1].substring(0, 8);
      console.log(`  ${date} ${time} - Session ${session.sessionId.substring(0, 15)}... (${session.deviceType})`);
    });
    
    // Show today in different formats
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('\n🕐 Date references:');
    console.log(`  Now: ${now.toISOString()}`);
    console.log(`  Today (UTC): ${today.toISOString()}`);
    console.log(`  Today (Local): ${today.toLocaleDateString()} ${today.toLocaleTimeString()}`);
    
  } catch (error) {
    console.error('❌ Error checking dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDates();