import { Router } from 'express';
import { LearningController } from '@/controllers/LearningController';
import { validateRequest } from '@/middleware/validation';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { body, param, query } from 'express-validator';

const router = Router();
const learningController = new LearningController();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Learning routes are working!', timestamp: new Date().toISOString() });
});

// Alternative paths endpoint
router.get('/learning-paths-v2', async (req, res) => {
  try {
    const { LearningService } = require('@/services/LearningService');
    const learningService = new LearningService();
    const paths = await learningService.getAllLearningPaths();
    res.json({
      success: true,
      data: paths,
      message: 'Learning paths retrieved successfully from v2 endpoint'
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Learning Paths routes
router.get('/paths', authenticateToken, learningController.getLearningPaths);

// Direct paths endpoint without auth for debugging
router.get('/paths-direct', async (req, res) => {
  try {
    const { LearningService } = require('@/services/LearningService');
    const learningService = new LearningService();
    const paths = await learningService.getAllLearningPaths();
    res.json({
      success: true,
      data: paths,
      message: 'Learning paths retrieved successfully from direct endpoint'
    });
  } catch (error) {
    console.error('Direct paths error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Direct single path endpoint without auth for debugging
router.get('/paths-direct/:pathId', async (req, res) => {
  try {
    const { pathId } = req.params;
    const { LearningService } = require('@/services/LearningService');
    const learningService = new LearningService();
    const path = await learningService.getLearningPathById(pathId);
    res.json({
      success: true,
      data: path,
      message: 'Learning path retrieved successfully from direct endpoint'
    });
  } catch (error) {
    console.error('Direct path error:', error);
    if ((error as Error).message === 'Learning path not found') {
      res.status(404).json({ error: 'Learning path not found' });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

router.get('/paths/:pathId', 
  optionalAuth,
  param('pathId').isString().notEmpty().withMessage('Path ID is required'),
  validateRequest,
  learningController.getLearningPathById
);
router.post('/paths', 
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('levelRange').isString().notEmpty().withMessage('Level range is required'),
  body('category').isString().notEmpty().withMessage('Category is required'),
  body('totalLessons').isInt({ min: 1 }).withMessage('Total lessons must be a positive integer'),
  body('estimatedHours').isInt({ min: 1 }).withMessage('Estimated hours must be a positive integer'),
  body('description').optional().isString(),
  validateRequest,
  learningController.createLearningPath
);

// Lessons routes
router.get('/paths/:pathId/lessons', 
  optionalAuth,
  param('pathId').isString().notEmpty().withMessage('Path ID is required'),
  validateRequest,
  learningController.getLessonsByPath
);

// Direct lesson endpoint without auth for debugging
router.get('/lessons-direct/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { LearningService } = require('@/services/LearningService');
    const learningService = new LearningService();
    const lesson = await learningService.getLessonById(lessonId);
    res.json({
      success: true,
      data: lesson,
      message: 'Lesson retrieved successfully from direct endpoint'
    });
  } catch (error) {
    console.error('Direct lesson error:', error);
    if ((error as Error).message === 'Lesson not found') {
      res.status(404).json({ error: 'Lesson not found' });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

router.get('/lessons/:lessonId', 
  optionalAuth,
  param('lessonId').isString().notEmpty().withMessage('Lesson ID is required'),
  validateRequest,
  learningController.getLessonById
);
router.post('/lessons', 
  body('pathId').isString().notEmpty().withMessage('Path ID is required'),
  body('title').isString().notEmpty().withMessage('Title is required'),
  body('scenarioType').isString().notEmpty().withMessage('Scenario type is required'),
  body('learningObjectives').isArray({ min: 1 }).withMessage('Learning objectives must be a non-empty array'),
  body('vocabulary').notEmpty().withMessage('Vocabulary is required'),
  body('grammarFocus').isArray({ min: 1 }).withMessage('Grammar focus must be a non-empty array'),
  body('estimatedDuration').isInt({ min: 1 }).withMessage('Estimated duration must be a positive integer'),
  body('description').optional().isString(),
  body('difficultyLevel').optional().isInt({ min: 1, max: 5 }),
  validateRequest,
  learningController.createLesson
);

// Progress routes
router.get('/progress', 
  authenticateToken,
  query('pathId').optional().isString(),
  validateRequest,
  learningController.getUserProgress
);
router.post('/progress', 
  authenticateToken,
  body('lessonId').isString().notEmpty().withMessage('Lesson ID is required'),
  body('status').isIn(['not_started', 'in_progress', 'completed']).withMessage('Status must be not_started, in_progress, or completed'),
  body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be a positive integer'),
  validateRequest,
  learningController.updateProgress
);

// Recommendations route
router.get('/recommendations', learningController.getRecommendedPaths);

export { router as learningRoutes };