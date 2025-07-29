import { Server, Socket } from 'socket.io';
import { ConversationService } from './ConversationService';
import { logger } from '@/utils/logger';

interface SocketData {
  userId?: string;
  sessionId?: string;
}

export function setupSocketHandlers(io: Server) {
  const conversationService = new ConversationService();

  io.on('connection', (socket: Socket<any, any, any, SocketData>) => {
    logger.info('Socket connected', { socketId: socket.id });

    // Authenticate user and join conversation
    socket.on('conversation:join', async ({ sessionId, userId, token }) => {
      try {
        // In a real implementation, you'd verify the token here
        // For now, we'll store user info in socket data
        socket.data.userId = userId;
        socket.data.sessionId = sessionId;
        
        socket.join(sessionId);
        
        // Get conversation session to send current state
        const session = await conversationService.getConversationSession(sessionId);
        
        socket.emit('conversation:joined', {
          sessionId,
          session,
          message: 'Successfully joined conversation'
        });
        
        logger.info('User joined conversation', { 
          socketId: socket.id, 
          sessionId, 
          userId 
        });
      } catch (error) {
        socket.emit('conversation:error', {
          message: 'Failed to join conversation',
          error: (error as Error).message
        });
        logger.error('Error joining conversation', {
          socketId: socket.id,
          sessionId,
          error: (error as Error).message
        });
      }
    });

    // Handle user messages with real-time AI responses
    socket.on('conversation:message', async ({ message }) => {
      try {
        const { userId, sessionId } = socket.data;
        
        if (!userId || !sessionId) {
          socket.emit('conversation:error', { message: 'Not authenticated or joined to conversation' });
          return;
        }

        if (!message || message.trim().length === 0) {
          socket.emit('conversation:error', { message: 'Message cannot be empty' });
          return;
        }

        // Show typing indicator for AI
        socket.emit('conversation:typing', { sender: 'ai', isTyping: true });
        
        // Send message through conversation service (which handles AI response)
        const result = await conversationService.sendMessage({
          sessionId,
          userId,
          message: message.trim()
        });

        // Hide typing indicator
        socket.emit('conversation:typing', { sender: 'ai', isTyping: false });

        // Emit the complete message exchange
        socket.emit('conversation:message-response', {
          userMessage: result.userMessage,
          aiResponse: result.aiResponse,
          session: result.session
        });

        logger.info('Real-time message exchange completed', {
          socketId: socket.id,
          sessionId,
          userId,
          messageLength: message.length,
          hasCorrections: !!result.userMessage.corrections
        });

      } catch (error) {
        socket.emit('conversation:typing', { sender: 'ai', isTyping: false });
        socket.emit('conversation:error', {
          message: 'Failed to process message',
          error: (error as Error).message
        });
        
        logger.error('Error processing real-time message', {
          socketId: socket.id,
          sessionId: socket.data.sessionId,
          error: (error as Error).message
        });
      }
    });

    // Handle typing indicators from user
    socket.on('conversation:typing', ({ isTyping }) => {
      const { sessionId } = socket.data;
      if (sessionId) {
        // Broadcast typing status to other participants (if any)
        socket.to(sessionId).emit('conversation:user-typing', { 
          sender: 'user', 
          isTyping 
        });
      }
    });

    // End conversation with evaluation
    socket.on('conversation:end', async () => {
      try {
        const { userId, sessionId } = socket.data;
        
        if (!userId || !sessionId) {
          socket.emit('conversation:error', { message: 'Not authenticated or joined to conversation' });
          return;
        }

        const result = await conversationService.endConversation(sessionId, userId);

        socket.emit('conversation:ended', {
          session: result.session,
          evaluation: result.evaluation,
          message: 'Conversation ended successfully'
        });

        // Leave the room
        socket.leave(sessionId);
        socket.data.sessionId = undefined;

        logger.info('Conversation ended via socket', {
          socketId: socket.id,
          sessionId,
          userId,
          score: result.evaluation.overallScore
        });

      } catch (error) {
        socket.emit('conversation:error', {
          message: 'Failed to end conversation',
          error: (error as Error).message
        });
        
        logger.error('Error ending conversation via socket', {
          socketId: socket.id,
          error: (error as Error).message
        });
      }
    });

    // Leave conversation room
    socket.on('conversation:leave', ({ sessionId }) => {
      socket.leave(sessionId || socket.data.sessionId);
      socket.data.sessionId = undefined;
      
      logger.info('Left conversation', { 
        socketId: socket.id, 
        sessionId: sessionId || socket.data.sessionId 
      });
      
      socket.emit('conversation:left', { message: 'Successfully left conversation' });
    });

    // Handle voice message transcription (placeholder for future implementation)
    socket.on('conversation:voice', async ({ audioData, sessionId }) => {
      try {
        // This would integrate with speech-to-text service
        socket.emit('conversation:voice-transcribed', {
          transcription: 'Voice transcription not yet implemented',
          message: 'Please use text messages for now'
        });
      } catch (error) {
        socket.emit('conversation:error', {
          message: 'Voice processing failed',
          error: (error as Error).message
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const { sessionId, userId } = socket.data;
      
      logger.info('Socket disconnected', { 
        socketId: socket.id, 
        sessionId, 
        userId 
      });

      // Clean up any active conversation state if needed
      if (sessionId) {
        socket.leave(sessionId);
      }
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error', { 
        socketId: socket.id, 
        error: error.message,
        sessionId: socket.data.sessionId,
        userId: socket.data.userId
      });
      
      socket.emit('conversation:error', {
        message: 'Socket error occurred',
        error: error.message
      });
    });
  });

  logger.info('Enhanced Socket.IO handlers with AI conversation support setup complete');
}