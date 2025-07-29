const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getLessons() {
  try {
    const lessons = await prisma.lesson.findMany({
      select: {
        id: true,
        title: true,
        pathId: true,
      },
    });
    
    console.log('Available lessons:');
    lessons.forEach(lesson => {
      console.log(`- ${lesson.title} (ID: ${lesson.id}, Path: ${lesson.pathId})`);
    });
  } catch (error) {
    console.error('Error getting lessons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getLessons();