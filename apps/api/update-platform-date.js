const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updatePlatformDate() {
  try {
    console.log('🔧 Updating platform analytics date to match user sessions...');
    
    // Get the correct date from user sessions
    const sessionDate = new Date('2025-08-02');
    sessionDate.setHours(0, 0, 0, 0);
    
    console.log('Target date:', sessionDate.toISOString().split('T')[0]);
    
    // Update platform analytics
    const updated = await prisma.platformAnalytics.updateMany({
      where: {
        date: new Date('2025-08-01T00:00:00.000Z')
      },
      data: {
        date: sessionDate
      }
    });
    
    console.log(`📊 Updated ${updated.count} platform analytics records`);
    
    // Verify the update
    const verification = await prisma.platformAnalytics.findFirst({
      where: {
        date: sessionDate
      }
    });
    
    if (verification) {
      console.log('✅ Platform analytics now shows:');
      console.log(`  Date: ${verification.date.toISOString().split('T')[0]}`);
      console.log(`  Daily Active Users: ${verification.dailyActiveUsers}`);
      console.log(`  Total Sessions: ${verification.totalSessions}`);
      console.log(`  Average Session Length: ${verification.avgSessionLength} seconds`);
    }
    
    console.log('🎉 Platform analytics date updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating platform date:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePlatformDate();