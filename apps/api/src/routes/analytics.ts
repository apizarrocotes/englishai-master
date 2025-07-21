import { Router } from 'express';

const router = Router();

// Placeholder routes for analytics
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Get dashboard analytics - coming soon' });
});

router.get('/progress', (req, res) => {
  res.json({ message: 'Get progress analytics - coming soon' });
});

export { router as analyticsRoutes };