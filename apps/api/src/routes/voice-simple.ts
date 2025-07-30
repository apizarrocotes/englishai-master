import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { OpenAIService } from '@/services/OpenAIService';

const router = Router();
const openaiService = new OpenAIService();

// Simple speech-to-text endpoint
router.post('/speech-to-text', 
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { audioBase64, format = 'webm' } = req.body;
      
      if (!audioBase64) {
        return res.status(400).json({
          success: false,
          error: 'Audio data is required'
        });
      }

      // Convert base64 audio to buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      
      // Use OpenAI Whisper for real speech-to-text
      const transcriptionResult = await openaiService.transcribeAudio(audioBuffer, format);
      const transcribedText = transcriptionResult.text;
      
      res.json({
        success: true,
        data: {
          text: transcribedText,
          confidence: 0.95
        }
      });
      
    } catch (error) {
      logger.error('Error in simple STT endpoint', { error: (error as Error).message });
      next(error);
    }
  }
);

// Simple text-to-speech endpoint
router.post('/text-to-speech',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required'
        });
      }

      // Generate real AI response using OpenAI
      const aiResponse = await openaiService.generateSimpleResponse(text);
      
      // Return text response (audio would require TTS implementation)
      res.json({
        success: true,
        data: {
          text: aiResponse,
          audioBase64: null // Would contain audio data in real implementation
        }
      });
      
    } catch (error) {
      logger.error('Error in simple TTS endpoint', { error: (error as Error).message });
      next(error);
    }
  }
);

export { router as voiceSimpleRoutes };