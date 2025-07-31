import { VoiceService } from './VoiceService';
import { logger } from '@/utils/logger';
import jwt from 'jsonwebtoken';

const voiceService = new VoiceService();

export function setupVoiceWebSocket(app: any) {
  app.ws('/api/voice/realtime', async (ws: any, req: any) => {
    // Extract token from query or headers
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      // Authenticate token manually
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userId = decoded.userId;
      const lessonId = req.query.lessonId as string;
      
      logger.info('Voice WebSocket connection established', { userId, lessonId });

      // Initialize voice session
      const session = await voiceService.createVoiceSession(userId, lessonId);
      
      ws.send(JSON.stringify({
        type: 'session_created',
        sessionId: session.id,
        status: 'ready'
      }));

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          
          switch (message.type) {
            case 'audio_data':
              await handleAudioData(ws, message, session.id);
              break;
            case 'audio_end':
              await handleAudioEnd(ws, session.id);
              break;
            case 'text_message':
              await handleTextMessage(ws, message, session.id);
              break;
            default:
              logger.warn('Unknown message type received', { type: message.type });
          }
        } catch (error) {
          logger.error('Error processing WebSocket message', { error: (error as Error).message });
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Failed to process message'
          }));
        }
      });

      ws.on('close', async () => {
        logger.info('Voice WebSocket connection closed', { userId, lessonId });
        await voiceService.endVoiceSession(session.id);
      });

      ws.on('error', (error: Error) => {
        logger.error('Voice WebSocket error', { error: error.message, userId, lessonId });
      });

    } catch (authError) {
      logger.error('Authentication failed for voice WebSocket', { error: (authError as Error).message });
      ws.close(1008, 'Authentication failed');
    }
  });
}

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

      // Generate streaming AI response
      logger.info('About to call generateStreamingResponse', { sessionId, transcription: result.transcription });
      
      await voiceService.generateStreamingResponse(
        sessionId, 
        result.transcription,
        (type: string, data: any) => {
          logger.info('Sending WebSocket message', { type, data });
          ws.send(JSON.stringify({
            type,
            ...data
          }));
        }
      );
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
    // Generate streaming AI response for text input
    await voiceService.generateStreamingResponse(
      sessionId, 
      message.text,
      (type: string, data: any) => {
        ws.send(JSON.stringify({
          type,
          ...data
        }));
      }
    );
  } catch (error) {
    logger.error('Error handling text message', { error: (error as Error).message, sessionId });
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to generate response'
    }));
  }
}