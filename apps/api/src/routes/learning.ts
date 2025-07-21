import { Router } from 'express';

const router = Router();

// Placeholder routes for learning management
router.get('/paths', (req, res) => {
  res.json({ message: 'Get learning paths - coming soon' });
});

router.get('/lessons/:pathId', (req, res) => {
  res.json({ message: 'Get lessons for path - coming soon' });
});

router.post('/progress', (req, res) => {
  res.json({ message: 'Update progress - coming soon' });
});

export { router as learningRoutes };