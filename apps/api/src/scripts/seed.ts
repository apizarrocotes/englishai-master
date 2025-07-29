import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function seedLearningPaths() {
  const learningPaths = [
    {
      name: 'Business English Essentials',
      description: 'Master professional English for workplace success, meetings, presentations, and networking',
      levelRange: 'B1-C1',
      category: 'business',
      totalLessons: 8,
      estimatedHours: 16,
    },
    {
      name: 'Travel English Companion',
      description: 'Essential English for travelers: airports, hotels, restaurants, and emergency situations',
      levelRange: 'A2-B2',
      category: 'travel',
      totalLessons: 6,
      estimatedHours: 12,
    },
    {
      name: 'Everyday Conversation Skills',
      description: 'Build confidence in daily English conversations with friends, family, and strangers',
      levelRange: 'A1-B2',
      category: 'conversation',
      totalLessons: 10,
      estimatedHours: 20,
    },
    {
      name: 'Grammar Fundamentals',
      description: 'Master essential English grammar rules with practical examples and exercises',
      levelRange: 'A1-B1',
      category: 'grammar',
      totalLessons: 12,
      estimatedHours: 24,
    },
    {
      name: 'Vocabulary Building',
      description: 'Expand your English vocabulary with themed lessons and memory techniques',
      levelRange: 'A2-C1',
      category: 'vocabulary',
      totalLessons: 15,
      estimatedHours: 18,
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
  // Get all paths
  const paths = await prisma.learningPath.findMany();

  const lessonsData = {
    'Business English Essentials': [
      {
        title: 'Professional Introductions',
        description: 'Learn to introduce yourself professionally in business settings',
        scenarioType: 'networking',
        learningObjectives: [
          'Master professional greetings',
          'Practice elevator pitches',
          'Build networking confidence',
        ],
        vocabulary: {
          'colleague': 'A person you work with professionally',
          'expertise': 'Expert skill or knowledge in a particular area',
          'initiative': 'A new plan or process to achieve a goal',
          'networking': 'Building professional relationships'
        },
        grammarFocus: ['Present simple', 'Question formation', 'Polite expressions'],
        difficultyLevel: 2,
        estimatedDuration: 30,
      },
      {
        title: 'Job Interview Excellence',
        description: 'Ace your next job interview with confidence',
        scenarioType: 'interview',
        learningObjectives: [
          'Answer common interview questions',
          'Discuss experience effectively',
          'Ask thoughtful questions',
        ],
        vocabulary: {
          'qualification': 'Skills or experience needed for a job',
          'achievement': 'Something accomplished successfully',
          'challenge': 'A difficult situation or task',
          'experience': 'Knowledge gained from doing something'
        },
        grammarFocus: ['Past perfect', 'Present perfect', 'Modal verbs'],
        difficultyLevel: 3,
        estimatedDuration: 45,
      },
      {
        title: 'Effective Business Meetings',
        description: 'Lead and participate in professional meetings',
        scenarioType: 'meeting',
        learningObjectives: [
          'Set clear meeting agendas',
          'Express opinions professionally',
          'Make decisions collaboratively',
        ],
        vocabulary: {
          'agenda': 'A list of items to be discussed in a meeting',
          'objective': 'Something that you plan to achieve',
          'proposal': 'A plan or suggestion for consideration',
          'deadline': 'A time by which something must be finished'
        },
        grammarFocus: ['Future tenses', 'Conditional sentences', 'Passive voice'],
        difficultyLevel: 4,
        estimatedDuration: 40,
      },
    ],
    'Travel English Companion': [
      {
        title: 'At the Airport',
        description: 'Navigate airport procedures and interactions',
        scenarioType: 'travel',
        learningObjectives: [
          'Check in for flights',
          'Handle security procedures',
          'Ask for directions',
        ],
        vocabulary: {
          'boarding pass': 'A document allowing you to board a plane',
          'departure': 'The action of leaving',
          'arrival': 'The action of coming to or reaching a place',
          'customs': 'The place where goods are checked when entering a country'
        },
        grammarFocus: ['Present continuous', 'Prepositions of place', 'Imperatives'],
        difficultyLevel: 2,
        estimatedDuration: 25,
      },
      {
        title: 'Hotel Check-in',
        description: 'Book rooms and handle hotel services',
        scenarioType: 'accommodation',
        learningObjectives: [
          'Make hotel reservations',
          'Check in and out',
          'Request hotel services',
        ],
        vocabulary: {
          'reservation': 'An arrangement to have something kept for you',
          'reception': 'The front desk of a hotel',
          'amenities': 'Features that provide comfort or convenience',
          'concierge': 'A hotel employee who helps guests'
        },
        grammarFocus: ['Modal verbs', 'Polite requests', 'Question forms'],
        difficultyLevel: 2,
        estimatedDuration: 30,
      },
    ],
    'Everyday Conversation Skills': [
      {
        title: 'Small Talk Mastery',
        description: 'Make comfortable conversation in social situations',
        scenarioType: 'social',
        learningObjectives: [
          'Start conversations naturally',
          'Keep conversations flowing',
          'End conversations politely',
        ],
        vocabulary: {
          'weather': 'The condition of the atmosphere',
          'weekend': 'Saturday and Sunday',
          'hobby': 'An activity done for pleasure',
          'interesting': 'Arousing curiosity or attention'
        },
        grammarFocus: ['Present simple', 'Present continuous', 'Question words'],
        difficultyLevel: 1,
        estimatedDuration: 20,
      },
      {
        title: 'Making Plans',
        description: 'Arrange meetings and social activities',
        scenarioType: 'planning',
        learningObjectives: [
          'Suggest activities',
          'Make arrangements',
          'Confirm plans',
        ],
        vocabulary: {
          'available': 'Free to do something',
          'schedule': 'A plan for activities or events',
          'suggestion': 'An idea or plan put forward',
          'convenient': 'Fitting in well with needs or plans'
        },
        grammarFocus: ['Future forms', 'Modal verbs', 'Time expressions'],
        difficultyLevel: 2,
        estimatedDuration: 25,
      },
    ],
  };

  for (const path of paths) {
    const pathLessons = lessonsData[path.name as keyof typeof lessonsData];
    if (pathLessons) {
      for (let i = 0; i < pathLessons.length; i++) {
        const lesson = pathLessons[i];
        await prisma.lesson.create({
          data: {
            pathId: path.id,
            orderIndex: i + 1,
            ...lesson,
          },
        });
        logger.info(`Created lesson: ${lesson.title} for path: ${path.name}`);
      }
    }
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