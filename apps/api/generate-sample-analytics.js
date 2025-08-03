const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateSampleAnalytics() {
  console.log('🚀 Starting analytics data generation...');

  try {
    // Generate data for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log(`📅 Generating data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Clear existing data
    await prisma.platformAnalytics.deleteMany({});
    await prisma.featureUsageAnalytics.deleteMany({});
    await prisma.geographicAnalytics.deleteMany({});
    await prisma.deviceAnalytics.deleteMany({});
    await prisma.performanceAnalytics.deleteMany({});

    console.log('🗑️  Cleared existing analytics data');

    // Generate daily data
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      currentDate.setHours(0, 0, 0, 0);

      // Generate platform analytics
      const dayOffset = Math.floor((endDate - currentDate) / (24 * 60 * 60 * 1000));
      const baseUsers = 100 + dayOffset * 2; // Growing user base
      const dailyVariation = Math.sin(dayOffset * 0.2) * 20; // Some variation

      await prisma.platformAnalytics.create({
        data: {
          date: currentDate,
          dailyActiveUsers: Math.max(50, Math.floor(baseUsers + dailyVariation)),
          monthlyActiveUsers: Math.floor(baseUsers * 2.5),
          totalSessions: Math.floor((baseUsers + dailyVariation) * 1.5),
          totalRevenue: Math.floor(Math.random() * 500) + 100,
          avgSessionLength: 300 + Math.floor(Math.random() * 200),
          newUsers: Math.floor(Math.random() * 15) + 5,
          returningUsers: Math.floor(baseUsers * 0.8)
        }
      });

      // Generate feature usage analytics
      const features = [
        { name: 'voice_conversations', weight: 0.45 },
        { name: 'text_chat', weight: 0.35 },
        { name: 'lesson_practice', weight: 0.20 }
      ];

      for (const feature of features) {
        const usageCount = Math.floor((baseUsers + dailyVariation) * feature.weight * (1 + Math.random() * 0.5));
        await prisma.featureUsageAnalytics.create({
          data: {
            date: currentDate,
            feature: feature.name,
            usageCount,
            uniqueUsers: Math.floor(usageCount * 0.7),
            totalTime: usageCount * (200 + Math.random() * 300),
            avgTimePerUse: 200 + Math.random() * 300
          }
        });
      }

      // Generate geographic analytics
      const countries = [
        { country: 'United States', countryCode: 'US', weight: 0.3 },
        { country: 'Spain', countryCode: 'ES', weight: 0.25 },
        { country: 'Mexico', countryCode: 'MX', weight: 0.15 },
        { country: 'Argentina', countryCode: 'AR', weight: 0.12 },
        { country: 'United Kingdom', countryCode: 'GB', weight: 0.08 },
        { country: 'Germany', countryCode: 'DE', weight: 0.06 },
        { country: 'France', countryCode: 'FR', weight: 0.04 }
      ];

      for (const country of countries) {
        const users = Math.floor((baseUsers + dailyVariation) * country.weight * (0.8 + Math.random() * 0.4));
        await prisma.geographicAnalytics.create({
          data: {
            date: currentDate,
            country: country.country,
            countryCode: country.countryCode,
            users,
            sessions: Math.floor(users * 1.5),
            totalTime: users * (300 + Math.random() * 600)
          }
        });
      }

      // Generate device analytics
      const deviceCombinations = [
        { deviceType: 'desktop', browser: 'chrome', os: 'windows', weight: 0.35 },
        { deviceType: 'mobile', browser: 'safari', os: 'ios', weight: 0.20 },
        { deviceType: 'mobile', browser: 'chrome', os: 'android', weight: 0.18 },
        { deviceType: 'desktop', browser: 'chrome', os: 'macos', weight: 0.12 },
        { deviceType: 'desktop', browser: 'firefox', os: 'windows', weight: 0.08 },
        { deviceType: 'tablet', browser: 'safari', os: 'ios', weight: 0.04 },
        { deviceType: 'desktop', browser: 'edge', os: 'windows', weight: 0.03 }
      ];

      for (const combo of deviceCombinations) {
        const users = Math.floor((baseUsers + dailyVariation) * combo.weight * (0.8 + Math.random() * 0.4));
        await prisma.deviceAnalytics.create({
          data: {
            date: currentDate,
            deviceType: combo.deviceType,
            browser: combo.browser,
            os: combo.os,
            users,
            sessions: Math.floor(users * 1.3)
          }
        });
      }

      // Generate performance analytics
      await prisma.performanceAnalytics.create({
        data: {
          date: currentDate,
          avgResponseTime: 120 + Math.random() * 80,
          p95ResponseTime: 250 + Math.random() * 100,
          p99ResponseTime: 400 + Math.random() * 200,
          errorRate: Math.random() * 3,
          errorCount: Math.floor(Math.random() * 25),
          uptimePercentage: 98.5 + Math.random() * 1.5,
          incidentCount: Math.random() < 0.1 ? 1 : 0
        }
      });
    }

    console.log('✅ Analytics data generation completed!');
    console.log(`📊 Generated data for ${Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000))} days`);

    // Display summary
    const platformCount = await prisma.platformAnalytics.count();
    const featureCount = await prisma.featureUsageAnalytics.count();
    const geoCount = await prisma.geographicAnalytics.count();
    const deviceCount = await prisma.deviceAnalytics.count();
    const performanceCount = await prisma.performanceAnalytics.count();

    console.log('\n📈 Data Summary:');
    console.log(`• Platform Analytics: ${platformCount} records`);
    console.log(`• Feature Usage: ${featureCount} records`);
    console.log(`• Geographic Data: ${geoCount} records`);
    console.log(`• Device Analytics: ${deviceCount} records`);
    console.log(`• Performance Metrics: ${performanceCount} records`);

  } catch (error) {
    console.error('❌ Error generating analytics data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateSampleAnalytics();