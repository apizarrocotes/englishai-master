import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '@/controllers/AuthController';
import { validateRequest } from '@/middleware/validation';

const router = Router();
const authController = new AuthController();

// Email/password authentication
router.post('/register',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
  validateRequest,
  authController.register
);

router.post('/login',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
  authController.login
);

// OAuth callback routes
router.post('/callback/google', 
  body('token').notEmpty().withMessage('Token is required'),
  validateRequest,
  authController.googleCallback
);

router.post('/callback/microsoft',
  body('token').notEmpty().withMessage('Token is required'),
  validateRequest,
  authController.microsoftCallback
);

router.post('/callback/apple',
  body('token').notEmpty().withMessage('Token is required'),
  validateRequest,
  authController.appleCallback
);

// Token management
router.post('/refresh',
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validateRequest,
  authController.refreshToken
);

router.post('/logout',
  authController.logout
);

// Session validation
router.get('/me',
  authController.getCurrentUser
);

export { router as authRoutes };