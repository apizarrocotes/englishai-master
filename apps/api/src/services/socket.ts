import { Server } from 'socket.io';
import { logger } from '@/utils/logger';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id });

    // Join conversation room
    socket.on('conversation:join', ({ sessionId }) => {
      socket.join(sessionId);
      logger.info('Joined conversation', { socketId: socket.id, sessionId });
    });

    // Handle conversation messages
    socket.on('conversation:message', ({ sessionId, message }) => {
      // Broadcast to all clients in the conversation room
      socket.to(sessionId).emit('conversation:message', {
        sessionId,
        message,
        sender: socket.id
      });
      
      logger.info('Message sent', { sessionId, messageLength: message.length });
    });

    // Handle typing indicators
    socket.on('conversation:typing', ({ sessionId }) => {
      socket.to(sessionId).emit('conversation:typing', { sender: 'ai' });
    });

    // Leave conversation room
    socket.on('conversation:leave', ({ sessionId }) => {
      socket.leave(sessionId);
      logger.info('Left conversation', { socketId: socket.id, sessionId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error', { socketId: socket.id, error: error.message });
    });
  });

  logger.info('Socket.IO handlers setup complete');
}