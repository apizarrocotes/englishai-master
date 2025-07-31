import { Router } from 'express';
import { VoiceService } from '@/services/VoiceService';
import { authenticateToken } from '@/middleware/auth';
import { logger } from '@/utils/logger';
// import { WebSocket } from 'ws';

const router = Router();
const voiceService = new VoiceService();

async function handleAudioData(ws: any, message: any, sessionId: string) {
  try {
    // Process audio chunk with OpenAI
    await voiceService.processAudioChunk(sessionId, message.audio, message.format);
  } catch (error) {
    logger.error('Error processing audio data', { error: (error as Error).message, sessionId });
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to process audio'
    }));
  }
}

async function handleAudioEnd(ws: any, sessionId: string) {
  try {
    // Finalize audio processing and get transcription
    const result = await voiceService.finalizeAudioProcessing(sessionId);
    
    if (result.transcription) {
      // Send transcription back to client
      ws.send(JSON.stringify({
        type: 'transcription',
        text: result.transcription
      }));

      // Generate AI response
      const aiResponse = await voiceService.generateAIResponse(sessionId, result.transcription);
      
      // Convert response to speech and send back
      const audioResponse = await voiceService.textToSpeech(aiResponse.text);
      
      ws.send(JSON.stringify({
        type: 'audio_response',
        text: aiResponse.text,
        audio: audioResponse.audioBase64
      }));
    }
  } catch (error) {
    logger.error('Error finalizing audio processing', { error: (error as Error).message, sessionId });
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to process speech'
    }));
  }
}

async function handleTextMessage(ws: any, message: any, sessionId: string) {
  try {
    // Generate AI response for text input
    const aiResponse = await voiceService.generateAIResponse(sessionId, message.text);
    
    // Convert response to speech
    const audioResponse = await voiceService.textToSpeech(aiResponse.text);
    
    ws.send(JSON.stringify({
      type: 'audio_response',
      text: aiResponse.text,
      audio: audioResponse.audioBase64
    }));
  } catch (error) {
    logger.error('Error handling text message', { error: (error as Error).message, sessionId });
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to generate response'
    }));
  }
}

// HTTP endpoints for voice features
router.post('/tts', authenticateToken, async (req, res, next) => {
  try {
    const { text, voice = 'alloy', speed = 1.0 } = req.body;
    
    // Debug logging
    logger.info('TTS endpoint - processing request', {
      text: text ? `${text.substring(0, 50)}...` : 'empty',
      voice,
      speed,
      bodyKeys: Object.keys(req.body)
    });
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    logger.info('TTS endpoint - calling voiceService.textToSpeech', {
      voice,
      speed,
      textLength: text.length
    });
    
    const result = await voiceService.textToSpeech(text, voice, speed);
    
    res.json({
      success: true,
      data: {
        audio: result.audioBase64,
        format: result.format
      }
    });
  } catch (error) {
    logger.error('Error in TTS endpoint', { error: (error as Error).message });
    next(error);
  }
});

router.post('/stt', authenticateToken, async (req, res, next) => {
  try {
    const { audio, format = 'webm' } = req.body;
    
    if (!audio) {
      return res.status(400).json({
        success: false,
        error: 'Audio data is required'
      });
    }
    
    const result = await voiceService.speechToText(audio, format);
    
    res.json({
      success: true,
      data: {
        text: result.transcription,
        confidence: result.confidence
      }
    });
  } catch (error) {
    logger.error('Error in STT endpoint', { error: (error as Error).message });
    next(error);
  }
});

export { router as voiceRoutes };