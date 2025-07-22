import { Router } from 'express';
import { ConversationController } from '@/controllers/ConversationController';
import { validateRequest } from '@/middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const conversationController = new ConversationController();

// Start a new conversation session
router.post('/start', 
  body('lessonId').isString().notEmpty().withMessage('Lesson ID is required'),
  body('scenarioId').optional().isString().withMessage('Scenario ID must be a string'),
  validateRequest,
  conversationController.startConversation
);

// Send a message in conversation
router.post('/:sessionId/message',
  param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  body('message').isString().notEmpty().withMessage('Message is required')
    .isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  validateRequest,
  conversationController.sendMessage
);

// End conversation and get evaluation
router.post('/:sessionId/end',
  param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  validateRequest,
  conversationController.endConversation
);

// Get conversation session details
router.get('/:sessionId', 
  param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  validateRequest,
  conversationController.getConversation
);

// Get user's conversation history
router.get('/history/user',
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  validateRequest,
  conversationController.getConversationHistory
);

// Get lesson scenarios
router.get('/lesson/:lessonId/scenarios',
  param('lessonId').isString().notEmpty().withMessage('Lesson ID is required'),
  validateRequest,
  conversationController.getLessonScenarios
);

export { router as conversationRoutes };