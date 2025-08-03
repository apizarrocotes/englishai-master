const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAnalyticsDate() {
  try {
    console.log('🔧 Fixing analytics date to today...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    console.log('Today:', today.toISOString());
    console.log('Yesterday:', yesterday.toISOString());
    
    // Update platform analytics date
    const updatedPlatform = await prisma.platformAnalytics.updateMany({
      where: {
        date: yesterday
      },
      data: {
        date: today
      }
    });
    
    console.log(`📊 Updated ${updatedPlatform.count} platform analytics records`);
    
    // Update user session analytics start times to today
    const startOfToday = today;
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Get all sessions from yesterday
    const yesterdaySessions = await prisma.userSessionAnalytics.findMany({
      where: {
        startTime: {
          gte: yesterday,
          lt: today
        }
      }
    });
    
    console.log(`🔄 Found ${yesterdaySessions.length} sessions to move to today`);
    
    // Update each session to today with random times
    for (const session of yesterdaySessions) {
      const randomTimeToday = new Date(startOfToday.getTime() + Math.random() * (endOfToday.getTime() - startOfToday.getTime()));
      const newEndTime = new Date(randomTimeToday.getTime() + session.duration * 1000);
      
      await prisma.userSessionAnalytics.update({
        where: { id: session.id },
        data: {
          startTime: randomTimeToday,
          endTime: newEndTime
        }
      });
      
      console.log(`✅ Updated session ${session.sessionId.substring(0, 15)}... to ${randomTimeToday.toLocaleTimeString()}`);
    }
    
    console.log('🎉 Analytics date fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing analytics date:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAnalyticsDate();