import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function seedLearningPaths() {
  const learningPaths = [
    {
      name: 'Business English Essentials',
      description: 'Master professional English for workplace success',
      levelRange: 'B1-C1',
      category: 'business',
      totalLessons: 20,
      estimatedHours: 40,
    },
    {
      name: 'Travel English Companion',
      description: 'Essential English for travelers and tourists',
      levelRange: 'A2-B2',
      category: 'travel',
      totalLessons: 15,
      estimatedHours: 25,
    },
    {
      name: 'Conversation Mastery',
      description: 'Build confidence in everyday English conversations',
      levelRange: 'A1-C2',
      category: 'conversation',
      totalLessons: 30,
      estimatedHours: 50,
    },
    {
      name: 'Academic English Foundations',
      description: 'Prepare for academic environments and tests',
      levelRange: 'B2-C2',
      category: 'academic',
      totalLessons: 25,
      estimatedHours: 60,
    },
  ];

  for (const path of learningPaths) {
    await prisma.learningPath.create({
      data: path,
    });
    logger.info(`Created learning path: ${path.name}`);
  }
}

async function seedLessons() {
  const businessPath = await prisma.learningPath.findFirst({
    where: { name: 'Business English Essentials' },
  });

  if (!businessPath) return;

  const lessons = [
    {
      pathId: businessPath.id,
      orderIndex: 1,
      title: 'Professional Introductions',
      description: 'Learn to introduce yourself professionally in business settings',
      scenarioType: 'networking',
      learningObjectives: [
        'Master professional greetings',
        'Practice elevator pitches',
        'Build networking confidence',
      ],
      vocabulary: [
        { word: 'colleague', definition: 'A person you work with', example: 'I\'d like you to meet my colleague, Sarah.' },
        { word: 'expertise', definition: 'Expert skill or knowledge', example: 'Her expertise in marketing is invaluable.' },
        { word: 'initiative', definition: 'A new plan or process', example: 'We\'re launching a new sustainability initiative.' },
      ],
      grammarFocus: ['Present simple', 'Question formation', 'Polite expressions'],
      difficultyLevel: 2,
      estimatedDuration: 30,
    },
    {
      pathId: businessPath.id,
      orderIndex: 2,
      title: 'Job Interview Excellence',
      description: 'Ace your next job interview with confidence',
      scenarioType: 'interview',
      learningObjectives: [
        'Answer common interview questions',
        'Discuss experience effectively',
        'Ask thoughtful questions',
      ],
      vocabulary: [
        { word: 'qualification', definition: 'Skills or experience needed for a job', example: 'I have all the qualifications for this position.' },
        { word: 'achievement', definition: 'Something accomplished successfully', example: 'My greatest achievement was leading the product launch.' },
        { word: 'challenge', definition: 'A difficult situation or task', example: 'I enjoy taking on new challenges.' },
      ],
      grammarFocus: ['Past perfect', 'Present perfect', 'Modal verbs'],
      difficultyLevel: 3,
      estimatedDuration: 45,
    },
  ];

  for (const lesson of lessons) {
    await prisma.lesson.create({
      data: lesson,
    });
    logger.info(`Created lesson: ${lesson.title}`);
  }
}

async function seedConversationScenarios() {
  const lessons = await prisma.lesson.findMany();

  for (const lesson of lessons) {
    const scenarios = [
      {
        lessonId: lesson.id,
        name: `${lesson.title} Practice`,
        context: `You are practicing ${lesson.title.toLowerCase()}. The AI will play the role of your conversation partner and guide you through realistic scenarios.`,
        aiPersona: {
          id: 'business-coach',
          name: 'Alex Chen',
          role: 'Business Coach',
          personality: 'Professional, encouraging, detail-oriented',
          accent: 'american',
          specialties: ['business communication', 'interview coaching', 'presentation skills'],
          adaptability: 4,
        },
        successCriteria: {
          minExchanges: 10,
          useTargetVocab: 5,
          correctGrammar: 0.8,
          completionGoals: ['Complete the scenario', 'Use target vocabulary', 'Maintain natural flow'],
        },
        maxDuration: 1800,
      },
    ];

    for (const scenario of scenarios) {
      await prisma.conversationScenario.create({
        data: scenario,
      });
      logger.info(`Created scenario: ${scenario.name}`);
    }
  }
}

async function main() {
  try {
    logger.info('Starting database seed...');

    // Clean existing data (be careful in production!)
    if (process.env.NODE_ENV === 'development') {
      await prisma.conversationMessage.deleteMany();
      await prisma.conversationSession.deleteMany();
      await prisma.conversationScenario.deleteMany();
      await prisma.userProgress.deleteMany();
      await prisma.learningAnalytics.deleteMany();
      await prisma.lesson.deleteMany();
      await prisma.learningPath.deleteMany();
      await prisma.learningProfile.deleteMany();
      // Don't delete users - they come from OAuth
    }

    // Seed data
    await seedLearningPaths();
    await seedLessons();
    await seedConversationScenarios();

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();