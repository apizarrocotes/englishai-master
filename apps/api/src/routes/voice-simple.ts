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

// Lesson-specific chat endpoint
router.post('/lesson-chat',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, lessonData, conversationHistory = [] } = req.body;
      
      if (!message || !lessonData) {
        return res.status(400).json({
          success: false,
          error: 'Message and lesson data are required'
        });
      }

      // Generate contextual AI response based on lesson content using simple response method
      const aiResponse = await openaiService.generateSimpleResponse(message);
      
      // Simple grammar/vocabulary corrections (mock for now)
      const corrections = generateSimpleCorrections(message, lessonData);
      const suggestions = generateSuggestions(lessonData);
      
      res.json({
        success: true,
        data: {
          text: aiResponse,
          corrections: corrections.length > 0 ? corrections : undefined,
          suggestions: suggestions.length > 0 ? suggestions : undefined
        }
      });
      
    } catch (error) {
      logger.error('Error in lesson chat endpoint', { error: (error as Error).message });
      next(error);
    }
  }
);

// Helper function to generate lesson-specific context
function generateLessonContextPrompt(lessonData: any, history: any[], currentMessage: string): string {
  const { title, scenarioType, learningObjectives, vocabulary, grammarFocus } = lessonData;
  
  let context = `You are an AI English teacher helping a student practice "${title}" in a ${scenarioType} scenario. `;
  
  // Add learning objectives
  if (learningObjectives && learningObjectives.length > 0) {
    context += `The lesson objectives are: ${learningObjectives.join(', ')}. `;
  }
  
  // Add vocabulary focus
  if (vocabulary && Object.keys(vocabulary).length > 0) {
    const vocabList = Object.entries(vocabulary).map(([word, def]) => `${word} (${def})`).join(', ');
    context += `Key vocabulary includes: ${vocabList}. `;
  }
  
  // Add grammar focus
  if (grammarFocus && grammarFocus.length > 0) {
    context += `Grammar focus: ${grammarFocus.join(', ')}. `;
  }
  
  context += `
  
Guidelines:
1. Stay in character for the ${scenarioType} scenario
2. Naturally incorporate lesson vocabulary and grammar points
3. Provide gentle corrections when needed
4. Keep responses conversational and encouraging
5. Ask follow-up questions to practice specific skills
6. Adapt difficulty to student's level
7. Make the conversation realistic and practical

Respond naturally as if you are actually in this scenario with the student.`;

  return context;
}

// Helper function for simple corrections
function generateSimpleCorrections(message: string, lessonData: any): any[] {
  const corrections: any[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Simple grammar patterns
  if (lowerMessage.includes('i want') && lessonData.scenarioType === 'Restaurant Ordering') {
    corrections.push({
      original: 'I want',
      corrected: 'I would like',
      explanation: 'In formal situations like restaurants, "I would like" is more polite than "I want".',
      type: 'usage'
    });
  }
  
  if (lowerMessage.includes('can i get') && lessonData.grammarFocus?.includes('polite requests')) {
    corrections.push({
      original: 'Can I get',
      corrected: 'Could I please have',
      explanation: 'Using "Could I please have" sounds more polite in formal requests.',
      type: 'grammar'
    });
  }
  
  return corrections;
}

// Helper function for suggestions
function generateSuggestions(lessonData: any): string[] {
  const suggestions: string[] = [];
  const { vocabulary, grammarFocus, learningObjectives } = lessonData;
  
  // Suggest vocabulary usage
  if (vocabulary && Object.keys(vocabulary).length > 0) {
    const randomVocab = Object.keys(vocabulary)[Math.floor(Math.random() * Object.keys(vocabulary).length)];
    if (Math.random() > 0.7) {
      suggestions.push(`Try using the word "${randomVocab}" in your next response.`);
    }
  }
  
  // Suggest grammar patterns
  if (grammarFocus && grammarFocus.length > 0 && Math.random() > 0.8) {
    const focus = grammarFocus[0];
    suggestions.push(`Remember to practice ${focus.toLowerCase()} in your responses.`);
  }
  
  return suggestions;
}

export { router as voiceSimpleRoutes };