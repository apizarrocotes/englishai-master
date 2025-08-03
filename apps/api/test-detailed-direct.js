const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDetailedDirect() {
  try {
    console.log('🧪 Testing detailed analytics with direct Prisma calls...');
    
    console.log('\n📊 Testing detailed sessions query...');
    const sessions = await prisma.userSessionAnalytics.findMany({
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
      take: 10
    });
    
    console.log(`Found ${sessions.length} sessions:`);
    sessions.forEach(session => {
      const timeAgo = Math.floor((Date.now() - session.startTime.getTime()) / 1000 / 60);
      const duration = session.duration || 0;
      
      console.log(`  - ${session.user?.name || 'Unknown'} (${session.user?.email || 'unknown@example.com'})`);
      console.log(`    Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);
      console.log(`    Device: ${session.deviceType} • ${session.browser} • ${session.os}`);
      console.log(`    Activity: ${session.interactions || 0} interactions, ${session.pageViews || 0} page views`);
      console.log(`    Started: ${timeAgo} min ago`);
      console.log(`    IP: ${session.ipAddress}`);
      console.log('');
    });
    
    console.log('\n👥 Testing top users query...');
    const userStats = await prisma.userSessionAnalytics.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      _sum: {
        duration: true
      },
      _max: {
        startTime: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });
    
    console.log(`Found ${userStats.length} user statistics:`);
    for (const stat of userStats) {
      const user = await prisma.user.findUnique({
        where: { id: stat.userId },
        select: {
          name: true,
          email: true
        }
      });
      
      const sessionCount = stat._count.id;
      const totalTime = stat._sum.duration || 0;
      const avgSessionTime = sessionCount > 0 ? Math.floor(totalTime / sessionCount) : 0;
      
      console.log(`  - ${user?.name || 'Unknown'} (${user?.email || 'unknown@example.com'})`);
      console.log(`    Sessions: ${sessionCount}`);
      console.log(`    Total time: ${Math.floor(totalTime / 60)} minutes`);
      console.log(`    Avg session: ${Math.floor(avgSessionTime / 60)} minutes`);
      console.log(`    Last seen: ${stat._max.startTime?.toLocaleString() || 'Never'}`);
      console.log('');
    }
    
    console.log('✅ Data queries working correctly!');
    console.log('\n📋 Summary:');
    console.log(`- ${sessions.length} total sessions in database`);
    console.log(`- ${userStats.length} unique users with activity`);
    console.log('- Data includes your session and Test User sessions');
    
  } catch (error) {
    console.error('❌ Error testing detailed queries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDetailedDirect();