import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { TeacherProfile, SYSTEM_TEACHER_PROFILES, UserTeacherPreferences } from '@/types/TeacherProfile';

const prisma = new PrismaClient();

export class TeacherProfileService {
  
  /**
   * Initialize system teacher profiles in database
   */
  async initializeSystemProfiles(): Promise<void> {
    try {
      for (const profile of SYSTEM_TEACHER_PROFILES) {
        const existingProfile = await prisma.teacherProfile.findFirst({
          where: {
            name: profile.name,
            isSystemProfile: true
          }
        });

        if (!existingProfile) {
          await prisma.teacherProfile.create({
            data: {
              userId: null,
              isSystemProfile: true,
              name: profile.name,
              description: profile.description,
              
              // Personality
              personalityName: profile.personality.name,
              personalityTitle: profile.personality.title,
              personalityBackground: profile.personality.background,
              personalitySpecialties: profile.personality.specialties,
              personalityCatchPhrases: profile.personality.catchPhrases,
              personalityMotivationalStyle: profile.personality.motivationalStyle,
              personalityAvatarUrl: profile.personality.avatarUrl,
              personalityBannerColor: profile.personality.bannerColor,
              
              // Voice
              voiceModel: profile.voiceConfig.voice,
              voiceSpeed: profile.voiceConfig.speed,
              voiceAccent: profile.voiceConfig.accent,
              
              // Teaching Style
              teachingPersonality: profile.teachingStyle.personality,
              teachingFormality: profile.teachingStyle.formality,
              teachingCorrectionStyle: profile.teachingStyle.correctionStyle,
              teachingEncouragementLevel: profile.teachingStyle.encouragementLevel,
              teachingAdaptability: profile.teachingStyle.adaptability,
              
              // Teaching Focus
              teachingPrimaryFocus: profile.teachingFocus.primaryFocus,
              teachingSecondaryFocus: profile.teachingFocus.secondaryFocus,
              teachingDetailLevel: profile.teachingFocus.detailLevel,
              teachingMethodology: profile.teachingFocus.methodology,
              
              systemPromptTemplate: profile.systemPromptTemplate,
              isActive: profile.isActive
            }
          });
          
          logger.info(`System teacher profile created: ${profile.name}`);
        }
      }
    } catch (error) {
      logger.error('Error initializing system teacher profiles', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get all available teacher profiles (system + user custom)
   */
  async getAvailableProfiles(userId?: string): Promise<TeacherProfile[]> {
    try {
      const profiles = await prisma.teacherProfile.findMany({
        where: {
          OR: [
            { isSystemProfile: true, isActive: true },
            { userId: userId, isActive: true }
          ]
        },
        orderBy: [
          { isSystemProfile: 'desc' }, // System profiles first
          { name: 'asc' }
        ]
      });

      return profiles.map(this.mapPrismaToTeacherProfile);
    } catch (error) {
      logger.error('Error getting available profiles', { error: (error as Error).message, userId });
      throw error;
    }
  }

  /**
   * Get user's current teacher preferences
   */
  async getUserTeacherPreferences(userId: string): Promise<UserTeacherPreferences | null> {
    try {
      const preferences = await prisma.userTeacherPreferences.findUnique({
        where: { userId },
        include: {
          selectedProfile: true
        }
      });

      if (!preferences) {
        return null;
      }

      return {
        id: preferences.id,
        userId: preferences.userId,
        selectedProfileId: preferences.selectedProfileId,
        customizations: preferences.customizations as any,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt
      };
    } catch (error) {
      logger.error('Error getting user teacher preferences', { error: (error as Error).message, userId });
      throw error;
    }
  }

  /**
   * Set user's teacher preferences
   */
  async setUserTeacherPreferences(
    userId: string, 
    profileId: string, 
    customizations?: any
  ): Promise<UserTeacherPreferences> {
    try {
      // Verify the profile exists and user has access to it
      const profile = await prisma.teacherProfile.findFirst({
        where: {
          id: profileId,
          OR: [
            { isSystemProfile: true },
            { userId: userId }
          ],
          isActive: true
        }
      });

      if (!profile) {
        throw new Error('Teacher profile not found or access denied');
      }

      const preferences = await prisma.userTeacherPreferences.upsert({
        where: { userId },
        update: {
          selectedProfileId: profileId,
          customizations: customizations || null,
          updatedAt: new Date()
        },
        create: {
          userId,
          selectedProfileId: profileId,
          customizations: customizations || null
        }
      });

      logger.info('User teacher preferences updated', { userId, profileId });

      return {
        id: preferences.id,
        userId: preferences.userId,
        selectedProfileId: preferences.selectedProfileId,
        customizations: preferences.customizations as any,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt
      };
    } catch (error) {
      logger.error('Error setting user teacher preferences', { 
        error: (error as Error).message, 
        userId, 
        profileId 
      });
      throw error;
    }
  }

  /**
   * Get user's active teacher profile with preferences applied
   */
  async getUserActiveTeacherProfile(userId: string): Promise<TeacherProfile | null> {
    try {
      const preferences = await this.getUserTeacherPreferences(userId);
      
      if (!preferences) {
        // Return default system profile (Professor Hamilton)
        const defaultProfile = await prisma.teacherProfile.findFirst({
          where: {
            name: "Professor Hamilton",
            isSystemProfile: true,
            isActive: true
          }
        });
        
        if (defaultProfile) {
          return this.mapPrismaToTeacherProfile(defaultProfile);
        }
        
        // Fallback to any active system profile
        const fallbackProfile = await prisma.teacherProfile.findFirst({
          where: {
            isSystemProfile: true,
            isActive: true
          }
        });
        
        return fallbackProfile ? this.mapPrismaToTeacherProfile(fallbackProfile) : null;
      }

      const profile = await prisma.teacherProfile.findUnique({
        where: { id: preferences.selectedProfileId }
      });

      if (!profile) {
        throw new Error('Selected teacher profile not found');
      }

      let teacherProfile = this.mapPrismaToTeacherProfile(profile);

      // Apply user customizations if any
      if (preferences.customizations) {
        teacherProfile = { ...teacherProfile, ...preferences.customizations };
      }

      return teacherProfile;
    } catch (error) {
      logger.error('Error getting user active teacher profile', { 
        error: (error as Error).message, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Create a custom teacher profile for a user
   */
  async createCustomProfile(userId: string, profileData: Partial<TeacherProfile>): Promise<TeacherProfile> {
    try {
      // Validate required fields
      if (!profileData.name || !profileData.description) {
        throw new Error('Name and description are required');
      }

      const createdProfile = await prisma.teacherProfile.create({
        data: {
          userId,
          isSystemProfile: false,
          name: profileData.name,
          description: profileData.description,
          
          // Use provided data or sensible defaults
          personalityName: profileData.personality?.name || profileData.name,
          personalityTitle: profileData.personality?.title || 'Teacher',
          personalityBackground: profileData.personality?.background || 'Experienced English teacher',
          personalitySpecialties: profileData.personality?.specialties || ['General English'],
          personalityCatchPhrases: profileData.personality?.catchPhrases || ['Great job!', 'Let\'s keep practicing!'],
          personalityMotivationalStyle: profileData.personality?.motivationalStyle || 'Encouraging and supportive',
          personalityAvatarUrl: profileData.personality?.avatarUrl || '/avatars/default-teacher.jpg',
          personalityBannerColor: profileData.personality?.bannerColor || '#3b82f6',
          
          voiceModel: profileData.voiceConfig?.voice || 'nova',
          voiceSpeed: profileData.voiceConfig?.speed || 1.0,
          voiceAccent: profileData.voiceConfig?.accent || 'american',
          
          teachingPersonality: profileData.teachingStyle?.personality || 'friendly',
          teachingFormality: profileData.teachingStyle?.formality || 'professional',
          teachingCorrectionStyle: profileData.teachingStyle?.correctionStyle || 'immediate',
          teachingEncouragementLevel: profileData.teachingStyle?.encouragementLevel || 'moderate',
          teachingAdaptability: profileData.teachingStyle?.adaptability || 7,
          
          teachingPrimaryFocus: profileData.teachingFocus?.primaryFocus || 'conversation',
          teachingSecondaryFocus: profileData.teachingFocus?.secondaryFocus,
          teachingDetailLevel: profileData.teachingFocus?.detailLevel || 'intermediate',
          teachingMethodology: profileData.teachingFocus?.methodology || 'communicative',
          
          systemPromptTemplate: profileData.systemPromptTemplate || 
            `You are ${profileData.name}, a friendly English teacher focused on helping students improve their English skills.`,
          isActive: true
        }
      });

      logger.info('Custom teacher profile created', { userId, profileId: createdProfile.id });

      return this.mapPrismaToTeacherProfile(createdProfile);
    } catch (error) {
      logger.error('Error creating custom teacher profile', { 
        error: (error as Error).message, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Update a custom teacher profile
   */
  async updateCustomProfile(userId: string, profileId: string, updates: Partial<TeacherProfile>): Promise<TeacherProfile> {
    try {
      // Verify user owns this profile
      const existingProfile = await prisma.teacherProfile.findFirst({
        where: {
          id: profileId,
          userId: userId,
          isSystemProfile: false
        }
      });

      if (!existingProfile) {
        throw new Error('Custom profile not found or access denied');
      }

      const updatedProfile = await prisma.teacherProfile.update({
        where: { id: profileId },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.description && { description: updates.description }),
          
          // Update personality if provided
          ...(updates.personality?.name && { personalityName: updates.personality.name }),
          ...(updates.personality?.title && { personalityTitle: updates.personality.title }),
          ...(updates.personality?.background && { personalityBackground: updates.personality.background }),
          ...(updates.personality?.specialties && { personalitySpecialties: updates.personality.specialties }),
          ...(updates.personality?.catchPhrases && { personalityCatchPhrases: updates.personality.catchPhrases }),
          ...(updates.personality?.motivationalStyle && { personalityMotivationalStyle: updates.personality.motivationalStyle }),
          ...(updates.personality?.avatarUrl && { personalityAvatarUrl: updates.personality.avatarUrl }),
          ...(updates.personality?.bannerColor && { personalityBannerColor: updates.personality.bannerColor }),
          
          // Update voice config if provided
          ...(updates.voiceConfig?.voice && { voiceModel: updates.voiceConfig.voice }),
          ...(updates.voiceConfig?.speed && { voiceSpeed: updates.voiceConfig.speed }),
          ...(updates.voiceConfig?.accent && { voiceAccent: updates.voiceConfig.accent }),
          
          // Update teaching style if provided
          ...(updates.teachingStyle?.personality && { teachingPersonality: updates.teachingStyle.personality }),
          ...(updates.teachingStyle?.formality && { teachingFormality: updates.teachingStyle.formality }),
          ...(updates.teachingStyle?.correctionStyle && { teachingCorrectionStyle: updates.teachingStyle.correctionStyle }),
          ...(updates.teachingStyle?.encouragementLevel && { teachingEncouragementLevel: updates.teachingStyle.encouragementLevel }),
          ...(updates.teachingStyle?.adaptability && { teachingAdaptability: updates.teachingStyle.adaptability }),
          
          // Update teaching focus if provided
          ...(updates.teachingFocus?.primaryFocus && { teachingPrimaryFocus: updates.teachingFocus.primaryFocus }),
          ...(updates.teachingFocus?.secondaryFocus !== undefined && { teachingSecondaryFocus: updates.teachingFocus.secondaryFocus }),
          ...(updates.teachingFocus?.detailLevel && { teachingDetailLevel: updates.teachingFocus.detailLevel }),
          ...(updates.teachingFocus?.methodology && { teachingMethodology: updates.teachingFocus.methodology }),
          
          ...(updates.systemPromptTemplate && { systemPromptTemplate: updates.systemPromptTemplate }),
          ...(updates.isActive !== undefined && { isActive: updates.isActive }),
          
          updatedAt: new Date()
        }
      });

      logger.info('Custom teacher profile updated', { userId, profileId });

      return this.mapPrismaToTeacherProfile(updatedProfile);
    } catch (error) {
      logger.error('Error updating custom teacher profile', { 
        error: (error as Error).message, 
        userId, 
        profileId 
      });
      throw error;
    }
  }

  /**
   * Delete a custom teacher profile
   */
  async deleteCustomProfile(userId: string, profileId: string): Promise<void> {
    try {
      // Verify user owns this profile
      const existingProfile = await prisma.teacherProfile.findFirst({
        where: {
          id: profileId,
          userId: userId,
          isSystemProfile: false
        }
      });

      if (!existingProfile) {
        throw new Error('Custom profile not found or access denied');
      }

      // Check if this profile is currently selected by the user
      const preferences = await prisma.userTeacherPreferences.findUnique({
        where: { userId }
      });

      if (preferences?.selectedProfileId === profileId) {
        // Reset to default system profile
        const defaultProfile = await prisma.teacherProfile.findFirst({
          where: {
            isSystemProfile: true,
            isActive: true
          }
        });

        if (defaultProfile) {
          await prisma.userTeacherPreferences.update({
            where: { userId },
            data: { selectedProfileId: defaultProfile.id }
          });
        }
      }

      await prisma.teacherProfile.delete({
        where: { id: profileId }
      });

      logger.info('Custom teacher profile deleted', { userId, profileId });
    } catch (error) {
      logger.error('Error deleting custom teacher profile', { 
        error: (error as Error).message, 
        userId, 
        profileId 
      });
      throw error;
    }
  }

  /**
   * Get default teacher profile (Professor Hamilton)
   */
  async getDefaultTeacherProfile(): Promise<TeacherProfile | null> {
    try {
      const defaultProfile = await prisma.teacherProfile.findFirst({
        where: {
          name: "Professor Hamilton",
          isSystemProfile: true,
          isActive: true
        }
      });
      
      if (defaultProfile) {
        return this.mapPrismaToTeacherProfile(defaultProfile);
      }
      
      // Fallback to any active system profile
      const fallbackProfile = await prisma.teacherProfile.findFirst({
        where: {
          isSystemProfile: true,
          isActive: true
        }
      });
      
      return fallbackProfile ? this.mapPrismaToTeacherProfile(fallbackProfile) : null;
    } catch (error) {
      logger.error('Error getting default teacher profile', { 
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Set active teacher profile for user
   */
  async setActiveTeacher(userId: string, teacherId: string): Promise<void> {
    try {
      // Check if teacher profile exists
      const profile = await prisma.teacherProfile.findUnique({
        where: { id: teacherId }
      });

      if (!profile) {
        throw new Error('Teacher profile not found');
      }

      // Upsert user teacher preferences
      await prisma.userTeacherPreferences.upsert({
        where: { userId },
        update: { selectedProfileId: teacherId },
        create: {
          userId,
          selectedProfileId: teacherId
        }
      });

      logger.info('Active teacher set', { userId, teacherId });
    } catch (error) {
      logger.error('Error setting active teacher', { 
        error: (error as Error).message, 
        userId, 
        teacherId 
      });
      throw error;
    }
  }

  /**
   * Map Prisma model to TypeScript interface
   */
  private mapPrismaToTeacherProfile(prismaProfile: any): TeacherProfile {
    return {
      id: prismaProfile.id,
      userId: prismaProfile.userId,
      isSystemProfile: prismaProfile.isSystemProfile,
      name: prismaProfile.name,
      description: prismaProfile.description,
      personality: {
        name: prismaProfile.personalityName,
        title: prismaProfile.personalityTitle,
        background: prismaProfile.personalityBackground,
        specialties: prismaProfile.personalitySpecialties,
        catchPhrases: prismaProfile.personalityCatchPhrases,
        motivationalStyle: prismaProfile.personalityMotivationalStyle,
        avatarUrl: prismaProfile.personalityAvatarUrl,
        bannerColor: prismaProfile.personalityBannerColor
      },
      voiceConfig: {
        voice: prismaProfile.voiceModel,
        speed: Number(prismaProfile.voiceSpeed),
        accent: prismaProfile.voiceAccent
      },
      teachingStyle: {
        personality: prismaProfile.teachingPersonality,
        formality: prismaProfile.teachingFormality,
        correctionStyle: prismaProfile.teachingCorrectionStyle,
        encouragementLevel: prismaProfile.teachingEncouragementLevel,
        adaptability: prismaProfile.teachingAdaptability
      },
      teachingFocus: {
        primaryFocus: prismaProfile.teachingPrimaryFocus,
        secondaryFocus: prismaProfile.teachingSecondaryFocus,
        detailLevel: prismaProfile.teachingDetailLevel,
        methodology: prismaProfile.teachingMethodology
      },
      systemPromptTemplate: prismaProfile.systemPromptTemplate,
      isActive: prismaProfile.isActive,
      createdAt: prismaProfile.createdAt,
      updatedAt: prismaProfile.updatedAt
    };
  }
}

export default TeacherProfileService;