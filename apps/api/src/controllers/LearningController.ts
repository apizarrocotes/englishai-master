import { Request, Response, NextFunction } from 'express';
import { LearningService } from '@/services/LearningService';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

export class LearningController {
  private learningService: LearningService;

  constructor() {
    this.learningService = new LearningService();
  }

  // Learning Paths endpoints
  getLearningPaths = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const paths = await this.learningService.getAllLearningPaths();
      
      res.json({
        success: true,
        data: paths,
        message: 'Learning paths retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting learning paths', { error: (error as Error).message });
      next(createError('Failed to retrieve learning paths', 500));
    }
  };

  getLearningPathById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pathId } = req.params;
      
      if (!pathId) {
        throw createError('Path ID is required', 400);
      }
      
      const path = await this.learningService.getLearningPathById(pathId);
      
      res.json({
        success: true,
        data: path,
        message: 'Learning path retrieved successfully'
      });
    } catch (error) {
      if ((error as Error).message === 'Learning path not found') {
        next(createError('Learning path not found', 404));
      } else {
        logger.error('Error getting learning path', { 
          pathId: req.params.pathId, 
          error: (error as Error).message 
        });
        next(createError('Failed to retrieve learning path', 500));
      }
    }
  };

  createLearningPath = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, levelRange, category, totalLessons, estimatedHours } = req.body;
      
      // Validate required fields
      if (!name || !levelRange || !category || !totalLessons || !estimatedHours) {
        throw createError('Missing required fields: name, levelRange, category, totalLessons, estimatedHours', 400);
      }
      
      const path = await this.learningService.createLearningPath({
        name,
        description,
        levelRange,
        category,
        totalLessons: parseInt(totalLessons),
        estimatedHours: parseInt(estimatedHours)
      });
      
      res.status(201).json({
        success: true,
        data: path,
        message: 'Learning path created successfully'
      });
    } catch (error) {
      logger.error('Error creating learning path', { error: (error as Error).message });
      next(error);
    }
  };

  // Lessons endpoints
  getLessonsByPath = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pathId } = req.params;
      const userId = (req as any).userId; // From auth middleware
      
      if (!pathId) {
        throw createError('Path ID is required', 400);
      }
      
      const lessons = await this.learningService.getLessonsByPathId(pathId);
      
      // If user is authenticated, include their progress
      let userProgress = [];
      if (userId) {
        userProgress = await this.learningService.getUserProgressByPath(userId, pathId);
      }
      
      // Merge lessons with user progress
      const lessonsWithProgress = lessons.map(lesson => {
        const progress = userProgress.find(p => p.lessonId === lesson.id);
        return {
          ...lesson,
          userProgress: progress || null
        };
      });
      
      res.json({
        success: true,
        data: lessonsWithProgress,
        message: 'Lessons retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting lessons', { 
        pathId: req.params.pathId, 
        error: (error as Error).message 
      });
      next(createError('Failed to retrieve lessons', 500));
    }
  };

  getLessonById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lessonId } = req.params;
      const userId = (req as any).userId; // From auth middleware
      
      if (!lessonId) {
        throw createError('Lesson ID is required', 400);
      }
      
      const lesson = await this.learningService.getLessonById(lessonId);
      
      // Include user progress if authenticated
      let userProgress = null;
      if (userId) {
        const progressList = await this.learningService.getUserProgress(userId);
        userProgress = progressList.find(p => p.lessonId === lessonId) || null;
      }
      
      res.json({
        success: true,
        data: {
          ...lesson,
          userProgress
        },
        message: 'Lesson retrieved successfully'
      });
    } catch (error) {
      if ((error as Error).message === 'Lesson not found') {
        next(createError('Lesson not found', 404));
      } else {
        logger.error('Error getting lesson', { 
          lessonId: req.params.lessonId, 
          error: (error as Error).message 
        });
        next(createError('Failed to retrieve lesson', 500));
      }
    }
  };

  createLesson = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        pathId, 
        title, 
        description, 
        scenarioType, 
        learningObjectives, 
        vocabulary, 
        grammarFocus,
        difficultyLevel,
        estimatedDuration 
      } = req.body;
      
      // Validate required fields
      if (!pathId || !title || !scenarioType || !learningObjectives || !vocabulary || !grammarFocus || !estimatedDuration) {
        throw createError('Missing required fields', 400);
      }
      
      const lesson = await this.learningService.createLesson({
        pathId,
        title,
        description,
        scenarioType,
        learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : [learningObjectives],
        vocabulary,
        grammarFocus: Array.isArray(grammarFocus) ? grammarFocus : [grammarFocus],
        difficultyLevel: difficultyLevel ? parseInt(difficultyLevel) : 1,
        estimatedDuration: parseInt(estimatedDuration)
      });
      
      res.status(201).json({
        success: true,
        data: lesson,
        message: 'Lesson created successfully'
      });
    } catch (error) {
      logger.error('Error creating lesson', { error: (error as Error).message });
      next(error);
    }
  };

  // Progress endpoints
  getUserProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId; // From auth middleware
      const { pathId } = req.query;
      
      if (!userId) {
        throw createError('User authentication required', 401);
      }
      
      let progress;
      if (pathId) {
        progress = await this.learningService.getUserProgressByPath(userId, pathId as string);
      } else {
        progress = await this.learningService.getUserProgress(userId);
      }
      
      res.json({
        success: true,
        data: progress,
        message: 'User progress retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting user progress', { 
        userId: (req as any).userId, 
        error: (error as Error).message 
      });
      next(error);
    }
  };

  updateProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId; // From auth middleware
      const { lessonId, status, score, timeSpent } = req.body;
      
      if (!userId) {
        throw createError('User authentication required', 401);
      }
      
      if (!lessonId || !status) {
        throw createError('Lesson ID and status are required', 400);
      }
      
      // Validate status
      const validStatuses = ['not_started', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        throw createError('Invalid status. Must be one of: ' + validStatuses.join(', '), 400);
      }
      
      const progress = await this.learningService.updateProgress({
        userId,
        lessonId,
        status,
        score: score ? parseInt(score) : undefined,
        timeSpent: timeSpent ? parseInt(timeSpent) : undefined
      });
      
      res.json({
        success: true,
        data: progress,
        message: 'Progress updated successfully'
      });
    } catch (error) {
      logger.error('Error updating progress', { 
        userId: (req as any).userId, 
        error: (error as Error).message 
      });
      next(error);
    }
  };

  // Recommendations endpoint
  getRecommendedPaths = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId; // From auth middleware
      
      if (!userId) {
        throw createError('User authentication required', 401);
      }
      
      const recommendedPaths = await this.learningService.getRecommendedPaths(userId);
      
      res.json({
        success: true,
        data: recommendedPaths,
        message: 'Recommended learning paths retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting recommended paths', { 
        userId: (req as any).userId, 
        error: (error as Error).message 
      });
      next(createError('Failed to get recommendations', 500));
    }
  };
}