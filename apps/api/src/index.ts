import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
// import expressWs from 'express-ws';

import { errorHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { authRoutes } from '@/routes/auth';
import { userRoutes } from '@/routes/users';
import { conversationRoutes } from '@/routes/conversations';
import { learningRoutes } from '@/routes/learning';
import { analyticsRoutes } from '@/routes/analytics';
// import { voiceRoutes } from '@/routes/voice';
// import { setupSocketHandlers } from '@/services/socket';
// import { setupVoiceWebSocket } from '@/services/VoiceWebSocketHandler';

dotenv.config({ path: '../../.env' });

// Get allowed origins from environment variables
const getDefaultOrigins = () => {
  const ipAddress = process.env.IP_ADDRESS || 'localhost';
  return [
    'http://localhost:3000', // Always allow localhost for development
    `http://${ipAddress}:3000` // Dynamic IP from environment
  ];
};

const allowedOrigins = [
  ...getDefaultOrigins(),
  'http://89.58.17.78:3000',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

const app = express();
const httpServer = createServer(app);

// Setup WebSocket support
// const wsInstance = expressWs(app, httpServer);
// const wsApp = wsInstance.app;

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Rate limiting - disabled in development
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Debug endpoint to see what's being called
app.get('/api/debug/learning-request', (req, res) => {
  console.log('🔥 DEBUG: Learning request received from frontend');
  res.json({ message: 'Debug endpoint working', timestamp: new Date().toISOString() });
});

// Direct learning paths endpoint for testing
app.get('/api/learning/paths-direct', async (req, res) => {
  try {
    console.log('🔥 DIRECT ENDPOINT: paths-direct called from IP:', req.ip);
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const paths = await prisma.learningPath.findMany({
      where: { isActive: true },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
            difficultyLevel: true,
            estimatedDuration: true,
          },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json({
      success: true,
      data: paths,
      message: 'Learning paths retrieved successfully from direct endpoint',
      count: paths.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database error', 
      details: (error as Error).message 
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/analytics', analyticsRoutes);
// app.use('/api/voice', voiceRoutes);

// Socket.IO setup
// setupSocketHandlers(io);

// WebSocket setup for voice
// setupVoiceWebSocket(wsApp);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`, {
    environment: process.env.NODE_ENV,
    port: PORT,
    host: '0.0.0.0'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export { app, io };