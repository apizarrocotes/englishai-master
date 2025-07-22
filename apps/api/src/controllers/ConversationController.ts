import { Request, Response, NextFunction } from 'express';
import { ConversationService } from '@/services/ConversationService';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

export class ConversationController {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
  }

  // Start a new conversation session
  startConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId; // From auth middleware
      const { lessonId, scenarioId } = req.body;

      if (!userId) {
        throw createError('User authentication required', 401);
      }

      if (!lessonId) {
        throw createError('Lesson ID is required', 400);
      }

      const session = await this.conversationService.startConversation({
        userId,
        lessonId,
        scenarioId
      });

      res.status(201).json({
        success: true,
        data: {
          session,
          message: 'Conversation started successfully'
        }
      });

    } catch (error) {
      logger.error('Error starting conversation', {
        userId: (req as any).userId,
        lessonId: req.body.lessonId,
        error: (error as Error).message
      });
      next(error);
    }
  };

  // Send a message in the conversation
  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!userId) {
        throw createError('User authentication required', 401);
      }

      if (!message || message.trim().length === 0) {
        throw createError('Message content is required', 400);
      }

      if (message.length > 1000) {
        throw createError('Message too long. Maximum 1000 characters allowed', 400);
      }

      const result = await this.conversationService.sendMessage({
        sessionId,
        userId,
        message: message.trim()
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error sending message', {
        userId: (req as any).userId,
        sessionId: req.params.sessionId,
        error: (error as Error).message
      });
      next(error);
    }
  };

  // End conversation and get evaluation
  endConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const { sessionId } = req.params;

      if (!userId) {
        throw createError('User authentication required', 401);
      }

      const result = await this.conversationService.endConversation(sessionId, userId);

      res.json({
        success: true,
        data: result,
        message: 'Conversation ended successfully'
      });

    } catch (error) {
      logger.error('Error ending conversation', {
        userId: (req as any).userId,
        sessionId: req.params.sessionId,
        error: (error as Error).message
      });
      next(error);
    }
  };

  // Get conversation session details
  getConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const { sessionId } = req.params;

      if (!userId) {
        throw createError('User authentication required', 401);
      }

      const session = await this.conversationService.getConversationSession(sessionId);

      // Check if user has access to this conversation
      if (session.userId !== userId) {
        throw createError('Unauthorized access to conversation', 403);
      }

      res.json({
        success: true,
        data: session
      });

    } catch (error) {
      if ((error as Error).message === 'Conversation session not found') {
        next(createError('Conversation not found', 404));
      } else {
        logger.error('Error getting conversation', {
          userId: (req as any).userId,
          sessionId: req.params.sessionId,
          error: (error as Error).message
        });
        next(error);
      }
    }
  };

  // Get user's conversation history
  getConversationHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        throw createError('User authentication required', 401);
      }

      if (limit > 50) {
        throw createError('Limit cannot exceed 50', 400);
      }

      const sessions = await this.conversationService.getUserConversationHistory(userId, limit);

      res.json({
        success: true,
        data: sessions,
        message: 'Conversation history retrieved successfully'
      });

    } catch (error) {
      logger.error('Error getting conversation history', {
        userId: (req as any).userId,
        error: (error as Error).message
      });
      next(createError('Failed to retrieve conversation history', 500));
    }
  };

  // Get lesson scenarios for conversation options
  getLessonScenarios = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lessonId } = req.params;

      if (!lessonId) {
        throw createError('Lesson ID is required', 400);
      }

      // This would typically get scenarios from the database
      // For now, we'll return a simple response indicating scenarios are available
      res.json({
        success: true,
        data: {
          lessonId,
          hasScenarios: true,
          message: 'Scenarios are available for this lesson'
        }
      });

    } catch (error) {
      logger.error('Error getting lesson scenarios', {
        lessonId: req.params.lessonId,
        error: (error as Error).message
      });
      next(createError('Failed to retrieve lesson scenarios', 500));
    }
  };
}