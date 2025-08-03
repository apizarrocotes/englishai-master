const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDetailedEndpoints() {
  try {
    console.log('🧪 Testing detailed analytics endpoints...');
    
    // Test the AnalyticsService methods directly
    const { AnalyticsService } = require('./dist/services/AnalyticsService');
    const analyticsService = AnalyticsService.getInstance();
    
    console.log('\n📊 Testing getDetailedSessions...');
    const sessions = await analyticsService.getDetailedSessions(10, 0);
    console.log(`Found ${sessions.length} detailed sessions:`);
    sessions.forEach(session => {
      const timeAgo = Math.floor((Date.now() - session.startTime.getTime()) / 1000 / 60);
      console.log(`  - ${session.userName} (${session.email})`);
      console.log(`    Duration: ${Math.floor(session.duration / 60)}:${(session.duration % 60).toString().padStart(2, '0')}`);
      console.log(`    Device: ${session.deviceType} • ${session.browser} • ${session.os}`);
      console.log(`    Activity: ${session.interactions} interactions, ${session.pageViews} page views`);
      console.log(`    Started: ${timeAgo} min ago`);
      console.log('');
    });
    
    console.log('\n👥 Testing getTopUsers...');
    const topUsers = await analyticsService.getTopUsers(5);
    console.log(`Found ${topUsers.length} top users:`);
    topUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.userName} (${user.email})`);
      console.log(`   Sessions: ${user.sessionCount}`);
      console.log(`   Total time: ${Math.floor(user.totalTime / 60)} minutes`);
      console.log(`   Avg session: ${Math.floor(user.avgSessionTime / 60)} minutes`);
      console.log(`   Last seen: ${user.lastSeen.toLocaleString()}`);
      console.log('');
    });
    
    console.log('✅ Both endpoints working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing detailed endpoints:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDetailedEndpoints();