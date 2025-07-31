import { Router, Request, Response } from 'express';
import { authenticateToken } from '@/middleware/auth';
import TeacherProfileService from '@/services/TeacherProfileService';
import { logger } from '@/utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    subscriptionTier: string;
  };
  userId?: string;
}

const router = Router();
const teacherProfileService = new TeacherProfileService();

/**
 * Initialize system teacher profiles (admin endpoint)
 */
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    await teacherProfileService.initializeSystemProfiles();
    
    logger.info('System teacher profiles initialized');
    res.status(200).json({
      success: true,
      message: 'System teacher profiles initialized successfully'
    });
  } catch (error) {
    logger.error('Error initializing system teacher profiles', { 
      error: (error as Error).message 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to initialize system teacher profiles'
    });
  }
});

/**
 * Get all available teacher profiles for user
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Debug logging
    logger.info('Teacher profiles endpoint - processing request', {
      userId: req.userId,
      userFromRequest: req.user,
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing',
        contentType: req.headers['content-type']
      }
    });

    const userId = req.userId || req.user?.id;
    if (!userId) {
      logger.error('Teacher profiles endpoint - no user ID found', {
        userId: req.userId,
        userFromRequest: req.user,
        authHeader: req.headers.authorization ? 'present' : 'missing'
      });
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const profiles = await teacherProfileService.getAvailableProfiles(userId);
    
    logger.info('Teacher profiles endpoint - success', {
      userId,
      profileCount: profiles.length
    });
    
    res.status(200).json({
      success: true,
      data: profiles
    });
  } catch (error) {
    logger.error('Error getting available teacher profiles', { 
      error: (error as Error).message,
      userId: req.userId || req.user?.id,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get teacher profiles'
    });
  }
});

/**
 * Get user's teacher preferences
 */
router.get('/user-preferences', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const preferences = await teacherProfileService.getUserTeacherPreferences(userId);
    
    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error getting user teacher preferences', { 
      error: (error as Error).message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get user preferences'
    });
  }
});

/**
 * Set user's teacher preferences
 */
router.post('/user-preferences', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Debug logging
    logger.info('Set user preferences endpoint - processing request', {
      userId: req.userId,
      userFromRequest: req.user,
      body: req.body,
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing',
        contentType: req.headers['content-type']
      }
    });

    const userId = req.userId || req.user?.id;
    if (!userId) {
      logger.error('Set user preferences endpoint - no user ID found', {
        userId: req.userId,
        userFromRequest: req.user,
        authHeader: req.headers.authorization ? 'present' : 'missing'
      });
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { profileId, customizations } = req.body;
    
    logger.info('Set user preferences endpoint - request details', {
      userId,
      profileId,
      customizations,
      bodyKeys: Object.keys(req.body)
    });
    
    if (!profileId) {
      logger.error('Set user preferences endpoint - missing profileId', {
        userId,
        body: req.body
      });
      return res.status(400).json({
        success: false,
        error: 'Profile ID is required'
      });
    }

    const preferences = await teacherProfileService.setUserTeacherPreferences(
      userId,
      profileId,
      customizations
    );
    
    logger.info('Set user preferences endpoint - success', {
      userId,
      profileId,
      preferencesId: preferences.id
    });
    
    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error setting user teacher preferences', { 
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      userId: req.userId || req.user?.id,
      profileId: req.body?.profileId,
      body: req.body
    });
    res.status(500).json({
      success: false,
      error: 'Failed to set user preferences'
    });
  }
});

/**
 * Get user's active teacher profile
 */
router.get('/active', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // For now, return a default profile if no user is authenticated (for debugging)
    const activeProfile = userId 
      ? await teacherProfileService.getUserActiveTeacherProfile(userId)
      : await teacherProfileService.getDefaultTeacherProfile();
    
    res.status(200).json({
      success: true,
      data: activeProfile
    });
  } catch (error) {
    logger.error('Error getting user active teacher profile', { 
      error: (error as Error).message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get active teacher profile'
    });
  }
});

/**
 * Create custom teacher profile
 */
router.post('/custom', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const profileData = req.body;
    
    // Validate required fields
    if (!profileData.name || !profileData.description) {
      return res.status(400).json({
        success: false,
        error: 'Name and description are required'
      });
    }

    const customProfile = await teacherProfileService.createCustomProfile(userId, profileData);
    
    res.status(201).json({
      success: true,
      data: customProfile
    });
  } catch (error) {
    logger.error('Error creating custom teacher profile', { 
      error: (error as Error).message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create custom profile'
    });
  }
});

/**
 * Update custom teacher profile
 */
router.put('/custom/:profileId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const profileId = req.params.profileId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!profileId) {
      return res.status(400).json({
        success: false,
        error: 'Profile ID is required'
      });
    }

    const updates = req.body;
    const updatedProfile = await teacherProfileService.updateCustomProfile(
      userId,
      profileId,
      updates
    );
    
    res.status(200).json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    logger.error('Error updating custom teacher profile', { 
      error: (error as Error).message,
      userId: req.user?.id,
      profileId: req.params.profileId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update custom profile'
    });
  }
});

/**
 * Delete custom teacher profile
 */
router.delete('/custom/:profileId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const profileId = req.params.profileId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!profileId) {
      return res.status(400).json({
        success: false,
        error: 'Profile ID is required'
      });
    }

    await teacherProfileService.deleteCustomProfile(userId, profileId);
    
    res.status(200).json({
      success: true,
      message: 'Custom profile deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting custom teacher profile', { 
      error: (error as Error).message,
      userId: req.user?.id,
      profileId: req.params.profileId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete custom profile'
    });
  }
});

/**
 * Set active teacher profile for user
 */
router.post('/set-active', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { teacherId } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    if (!teacherId) {
      return res.status(400).json({
        success: false,
        error: 'Teacher ID is required'
      });
    }
    
    await teacherProfileService.setActiveTeacher(userId, teacherId);
    
    logger.info('Active teacher set', { userId, teacherId });
    
    res.json({
      success: true,
      message: 'Active teacher updated successfully'
    });
  } catch (error) {
    logger.error('Error setting active teacher:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set active teacher'
    });
  }
});

/**
 * Get system teacher profiles (public endpoint for previews)
 */
router.get('/system', async (req: Request, res: Response) => {
  try {
    const profiles = await teacherProfileService.getAvailableProfiles();
    const systemProfiles = profiles.filter(profile => profile.isSystemProfile);
    
    res.status(200).json({
      success: true,
      data: systemProfiles
    });
  } catch (error) {
    logger.error('Error getting system teacher profiles', { 
      error: (error as Error).message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get system profiles'
    });
  }
});

export default router;