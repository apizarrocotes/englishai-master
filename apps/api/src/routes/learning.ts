import { Router } from 'express';
import { LearningController } from '@/controllers/LearningController';
import { validateRequest } from '@/middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const learningController = new LearningController();

// Learning Paths routes
router.get('/paths', learningController.getLearningPaths);
router.get('/paths/:pathId', 
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
  param('pathId').isString().notEmpty().withMessage('Path ID is required'),
  validateRequest,
  learningController.getLessonsByPath
);
router.get('/lessons/:lessonId', 
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
  query('pathId').optional().isString(),
  validateRequest,
  learningController.getUserProgress
);
router.post('/progress', 
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