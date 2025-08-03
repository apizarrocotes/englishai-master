const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFeatureUsage() {
  try {
    console.log('Checking database for feature usage data...');
    
    // Check feature usage analytics
    const featureUsage = await prisma.featureUsageAnalytics.findMany({
      take: 10,
      orderBy: { date: 'desc' }
    });
    
    console.log(`Found ${featureUsage.length} feature usage records`);
    if (featureUsage.length > 0) {
      console.log('Sample feature usage data:');
      featureUsage.forEach(f => {
        console.log(`- ${f.feature}: ${f.usageCount} uses on ${f.date.toISOString().split('T')[0]}`);
      });
    }
    
    // Check conversation sessions
    const sessions = await prisma.conversationSession.findMany({
      take: 5,
      orderBy: { startedAt: 'desc' }
    });
    
    console.log(`\nFound ${sessions.length} conversation sessions`);
    if (sessions.length > 0) {
      console.log('Recent sessions:');
      sessions.forEach(s => {
        console.log(`- Session ${s.id}: User ${s.userId}, Started: ${s.startedAt}`);
      });
    }
    
    // Check users
    const users = await prisma.user.count();
    console.log(`\nTotal users: ${users}`);
    
    // Check messages
    const messages = await prisma.message.count();
    console.log(`Total messages: ${messages}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFeatureUsage();