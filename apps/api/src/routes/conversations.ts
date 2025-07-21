import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '@/middleware/validation';

const router = Router();

// Placeholder routes for conversation management
router.post('/start', 
  body('scenarioId').isString().notEmpty(),
  validateRequest,
  (req, res) => {
    res.json({ message: 'Start conversation - coming soon' });
  }
);

router.post('/:sessionId/message',
  body('message').isString().notEmpty(),
  validateRequest,
  (req, res) => {
    res.json({ message: 'Send message - coming soon' });
  }
);

router.get('/:sessionId', (req, res) => {
  res.json({ message: 'Get conversation - coming soon' });
});

export { router as conversationRoutes };