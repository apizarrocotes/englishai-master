import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

const prisma = new PrismaClient();

interface CreateUserData {
  email: string;
  name: string;
  avatarUrl?: string;
  provider: string;
  providerId: string;
}

export class UserService {
  async createOrUpdateUser(data: CreateUserData) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        include: { learningProfile: true }
      });

      if (existingUser) {
        // Update existing user
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: data.name,
            avatarUrl: data.avatarUrl,
            updatedAt: new Date(),
          },
          include: { learningProfile: true }
        });

        logger.info('User updated', { userId: updatedUser.id, email: updatedUser.email });
        return updatedUser;
      }

      // Create new user with default learning profile
      const newUser = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl,
          provider: data.provider,
          providerId: data.providerId,
          learningProfile: {
            create: {
              currentLevel: 'A1', // Will be updated during onboarding
              learningGoals: ['general'],
              nativeLanguage: 'es',
              weeklyGoalMinutes: 300,
              preferredSchedule: {
                days: ['monday', 'wednesday', 'friday'],
                timeSlots: ['evening']
              }
            }
          }
        },
        include: { learningProfile: true }
      });

      logger.info('User created', { userId: newUser.id, email: newUser.email });
      return newUser;
    } catch (error) {
      logger.error('Error creating/updating user', { error: (error as Error).message, email: data.email });
      throw createError('Failed to create or update user', 500);
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          learningProfile: true,
          userProgress: true,
          learningAnalytics: {
            orderBy: { date: 'desc' },
            take: 30 // Last 30 days
          }
        }
      });

      return user;
    } catch (error) {
      logger.error('Error getting user by ID', { error: (error as Error).message, userId });
      throw createError('Failed to get user', 500);
    }
  }

  async updateUser(userId: string, data: Partial<CreateUserData>) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: { learningProfile: true }
      });

      logger.info('User updated', { userId: updatedUser.id });
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user', { error: (error as Error).message, userId });
      throw createError('Failed to update user', 500);
    }
  }

  async findByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: { learningProfile: true }
      });
    } catch (error) {
      logger.error('Error finding user by email', { error: (error as Error).message, email });
      throw createError('Failed to find user', 500);
    }
  }
}