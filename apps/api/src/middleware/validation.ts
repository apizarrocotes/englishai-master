import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { createError } from '@/middleware/errorHandler';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: (error as any).param || 'unknown',
      message: (error as any).msg || 'Invalid value',
      value: (error as any).value,
    }));

    return next(createError(
      `Validation failed: ${errorMessages.map(e => e.message).join(', ')}`,
      400,
      'VALIDATION_ERROR'
    ));
  }
  
  next();
};