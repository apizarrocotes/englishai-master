import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface CreateLearningPathData {
  name: string;
  description?: string;
  levelRange: string;
  category: string;
  totalLessons: number;
  estimatedHours: number;
}

export interface CreateLessonData {
  pathId: string;
  title: string;
  description?: string;
  scenarioType: string;
  learningObjectives: string[];
  vocabulary: any;
  grammarFocus: string[];
  difficultyLevel?: number;
  estimatedDuration: number;
}

export interface UpdateProgressData {
  userId: string;
  lessonId: string;
  status: string;
  score?: number;
  timeSpent?: number;
}

export class LearningService {
  
  // Learning Paths Management
  async getAllLearningPaths() {
    try {
      const paths = await prisma.learningPath.findMany({
        where: { isActive: true },
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              orderIndex: true,
              difficultyLevel: true,
              estimatedDuration: true,
            },
            orderBy: { orderIndex: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      });
      
      logger.info('Retrieved learning paths', { count: paths.length });
      return paths;
    } catch (error) {
      logger.error('Error retrieving learning paths', { error: (error as Error).message });
      throw error;
    }
  }

  async getLearningPathById(pathId: string) {
    try {
      const path = await prisma.learningPath.findUnique({
        where: { id: pathId },
        include: {
          lessons: {
            include: {
              conversationScenarios: true
            },
            orderBy: { orderIndex: 'asc' }
          }
        }
      });
      
      if (!path) {
        throw new Error('Learning path not found');
      }
      
      logger.info('Retrieved learning path', { pathId, lessonsCount: path.lessons.length });
      return path;
    } catch (error) {
      logger.error('Error retrieving learning path', { pathId, error: (error as Error).message });
      throw error;
    }
  }

  async createLearningPath(data: CreateLearningPathData) {
    try {
      const path = await prisma.learningPath.create({
        data,
        include: {
          lessons: true
        }
      });
      
      logger.info('Created learning path', { pathId: path.id, name: path.name });
      return path;
    } catch (error) {
      logger.error('Error creating learning path', { error: (error as Error).message });
      throw error;
    }
  }

  // Lessons Management
  async getLessonsByPathId(pathId: string) {
    try {
      const lessons = await prisma.lesson.findMany({
        where: { pathId },
        include: {
          conversationScenarios: true,
          userProgress: true
        },
        orderBy: { orderIndex: 'asc' }
      });
      
      logger.info('Retrieved lessons for path', { pathId, count: lessons.length });
      return lessons;
    } catch (error) {
      logger.error('Error retrieving lessons', { pathId, error: (error as Error).message });
      throw error;
    }
  }

  async getLessonById(lessonId: string) {
    try {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          path: true,
          conversationScenarios: true,
          userProgress: true
        }
      });
      
      if (!lesson) {
        throw new Error('Lesson not found');
      }
      
      logger.info('Retrieved lesson', { lessonId, title: lesson.title });
      return lesson;
    } catch (error) {
      logger.error('Error retrieving lesson', { lessonId, error: (error as Error).message });
      throw error;
    }
  }

  async createLesson(data: CreateLessonData) {
    try {
      // Get the next order index for this path
      const lastLesson = await prisma.lesson.findFirst({
        where: { pathId: data.pathId },
        orderBy: { orderIndex: 'desc' }
      });
      
      const orderIndex = lastLesson ? lastLesson.orderIndex + 1 : 1;
      
      const lesson = await prisma.lesson.create({
        data: {
          ...data,
          orderIndex,
          difficultyLevel: data.difficultyLevel || 1
        },
        include: {
          path: true,
          conversationScenarios: true
        }
      });
      
      // Update the path's total lessons count
      await prisma.learningPath.update({
        where: { id: data.pathId },
        data: {
          totalLessons: {
            increment: 1
          }
        }
      });
      
      logger.info('Created lesson', { lessonId: lesson.id, title: lesson.title, pathId: data.pathId });
      return lesson;
    } catch (error) {
      logger.error('Error creating lesson', { error: (error as Error).message });
      throw error;
    }
  }

  // User Progress Management
  async getUserProgress(userId: string) {
    try {
      const progress = await prisma.userProgress.findMany({
        where: { userId },
        include: {
          lesson: {
            include: {
              path: true
            }
          }
        },
        orderBy: {
          lesson: {
            orderIndex: 'asc'
          }
        }
      });
      
      logger.info('Retrieved user progress', { userId, progressCount: progress.length });
      return progress;
    } catch (error) {
      logger.error('Error retrieving user progress', { userId, error: (error as Error).message });
      throw error;
    }
  }

  async getUserProgressByPath(userId: string, pathId: string) {
    try {
      const progress = await prisma.userProgress.findMany({
        where: {
          userId,
          lesson: {
            pathId
          }
        },
        include: {
          lesson: true
        },
        orderBy: {
          lesson: {
            orderIndex: 'asc'
          }
        }
      });
      
      logger.info('Retrieved user progress for path', { userId, pathId, progressCount: progress.length });
      return progress;
    } catch (error) {
      logger.error('Error retrieving user progress for path', { userId, pathId, error: (error as Error).message });
      throw error;
    }
  }

  async updateProgress(data: UpdateProgressData) {
    try {
      const { userId, lessonId, status, score, timeSpent } = data;
      
      const progress = await prisma.userProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        update: {
          status,
          score,
          timeSpent: timeSpent ? { increment: timeSpent } : undefined,
          attempts: { increment: 1 },
          completedAt: status === 'completed' ? new Date() : undefined
        },
        create: {
          userId,
          lessonId,
          status,
          score,
          timeSpent: timeSpent || 0,
          attempts: 1,
          completedAt: status === 'completed' ? new Date() : undefined
        },
        include: {
          lesson: {
            include: {
              path: true
            }
          }
        }
      });
      
      // Update learning analytics
      if (status === 'completed') {
        await this.updateLearningAnalytics(userId, lessonId, score);
      }
      
      logger.info('Updated user progress', { userId, lessonId, status, score });
      return progress;
    } catch (error) {
      logger.error('Error updating progress', { userId: data.userId, lessonId: data.lessonId, error: (error as Error).message });
      throw error;
    }
  }

  // Learning Path Recommendations
  async getRecommendedPaths(userId: string) {
    try {
      // Get user's learning profile
      const userProfile = await prisma.learningProfile.findUnique({
        where: { userId }
      });
      
      if (!userProfile) {
        // Return beginner paths for users without profiles
        const paths = await prisma.learningPath.findMany({
          where: {
            isActive: true,
            levelRange: {
              contains: 'beginner'
            }
          },
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                difficultyLevel: true
              }
            }
          }
        });
        
        return paths;
      }
      
      // Get user's current progress
      const completedLessons = await prisma.userProgress.count({
        where: {
          userId,
          status: 'completed'
        }
      });
      
      // Recommend paths based on current level and progress
      const recommendedPaths = await prisma.learningPath.findMany({
        where: {
          isActive: true,
          OR: [
            { levelRange: { contains: userProfile.currentLevel } },
            { levelRange: { contains: userProfile.targetLevel || '' } }
          ]
        },
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              difficultyLevel: true,
              estimatedDuration: true
            }
          }
        },
        orderBy: { estimatedHours: 'asc' }
      });
      
      logger.info('Generated path recommendations', { userId, pathCount: recommendedPaths.length, completedLessons });
      return recommendedPaths;
    } catch (error) {
      logger.error('Error getting recommended paths', { userId, error: (error as Error).message });
      throw error;
    }
  }

  // Analytics
  private async updateLearningAnalytics(userId: string, lessonId: string, score?: number) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get lesson details for time calculation
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId }
      });
      
      if (!lesson) return;
      
      // Update or create daily analytics
      await prisma.learningAnalytics.upsert({
        where: {
          userId_date: {
            userId,
            date: today
          }
        },
        update: {
          lessonsCompleted: { increment: 1 },
          minutesPracticed: { increment: lesson.estimatedDuration },
          averageScore: score ? score : undefined // TODO: Calculate proper average
        },
        create: {
          userId,
          date: today,
          lessonsCompleted: 1,
          minutesPracticed: lesson.estimatedDuration,
          averageScore: score || null,
          conversationsCount: 0,
          strengths: [],
          weaknesses: []
        }
      });
      
      logger.info('Updated learning analytics', { userId, lessonId });
    } catch (error) {
      logger.error('Error updating learning analytics', { userId, lessonId, error: (error as Error).message });
    }
  }
}