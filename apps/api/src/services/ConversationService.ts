import { PrismaClient } from '@prisma/client';
import { OpenAIService } from './OpenAIService';
import { LearningService } from './LearningService';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface StartConversationData {
  userId: string;
  lessonId: string;
  scenarioId?: string;
}

export interface SendMessageData {
  sessionId: string;
  userId: string;
  message: string;
}

export interface ConversationSession {
  id: string;
  userId: string;
  scenarioId: string;
  status: string;
  durationSeconds: number;
  messagesCount: number;
  score: any;
  feedback: string | null;
  startedAt: Date;
  completedAt: Date | null;
  scenario: {
    id: string;
    name: string;
    context: string;
    aiPersona: any;
    successCriteria: any;
    lesson: {
      id: string;
      title: string;
      description: string | null;
      scenarioType: string;
      learningObjectives: string[];
      vocabulary: any;
      grammarFocus: string[];
      difficultyLevel: number;
    };
  };
  messages: {
    id: string;
    sender: string;
    content: string;
    audioUrl: string | null;
    corrections: any;
    timestamp: Date;
  }[];
}

export class ConversationService {
  private openAIService: OpenAIService;
  private learningService: LearningService;

  constructor() {
    this.openAIService = new OpenAIService();
    this.learningService = new LearningService();
  }

  /**
   * Start a new conversation session
   */
  async startConversation(data: StartConversationData): Promise<ConversationSession> {
    try {
      // Check for existing active sessions for this user and lesson
      const existingSession = await prisma.conversationSession.findFirst({
        where: {
          userId: data.userId,
          status: 'active',
          scenario: {
            lessonId: data.lessonId
          }
        },
        include: {
          scenario: {
            include: {
              lesson: true
            }
          },
          messages: {
            orderBy: { timestamp: 'asc' }
          }
        }
      });

      // If there's an existing active session, return it instead of creating a new one
      if (existingSession) {
        logger.info('Returning existing active conversation session', {
          sessionId: existingSession.id,
          userId: data.userId,
          lessonId: data.lessonId
        });
        return existingSession as ConversationSession;
      }

      // Get lesson and scenario information
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId },
        include: {
          conversationScenarios: true,
          path: true
        }
      });

      if (!lesson) {
        throw new Error('Lesson not found');
      }

      // Use provided scenario or get the first one for the lesson
      let scenario = null;
      if (data.scenarioId) {
        scenario = await prisma.conversationScenario.findUnique({
          where: { id: data.scenarioId },
          include: { lesson: true }
        });
      } else if (lesson.conversationScenarios.length > 0) {
        scenario = await prisma.conversationScenario.findUnique({
          where: { id: lesson.conversationScenarios[0].id },
          include: { lesson: true }
        });
      }

      if (!scenario) {
        // Create a default scenario if none exists
        scenario = await this.createDefaultScenario(lesson);
      }

      // Create conversation session
      const session = await prisma.conversationSession.create({
        data: {
          userId: data.userId,
          scenarioId: scenario.id,
          status: 'active',
          durationSeconds: 0,
          messagesCount: 0,
        },
        include: {
          scenario: {
            include: {
              lesson: true
            }
          },
          messages: {
            orderBy: { timestamp: 'asc' }
          }
        }
      });

      // Generate AI teacher's opening message
      const lessonContext = {
        title: lesson.title,
        objectives: lesson.learningObjectives,
        vocabulary: lesson.vocabulary || {},
        grammarFocus: lesson.grammarFocus,
        difficultyLevel: lesson.difficultyLevel,
        scenarioType: lesson.scenarioType
      };

      const openingMessage = await this.openAIService.generateConversationStarter(
        scenario.aiPersona as any,
        lessonContext as any
      );

      // Save AI's opening message
      await prisma.conversationMessage.create({
        data: {
          sessionId: session.id,
          sender: 'ai',
          content: openingMessage,
          corrections: null as any
        }
      });

      // Update message count
      await prisma.conversationSession.update({
        where: { id: session.id },
        data: { messagesCount: 1 }
      });

      logger.info('Conversation session started', {
        sessionId: session.id,
        userId: data.userId,
        lessonId: data.lessonId
      });

      // Return updated session with messages
      return await this.getConversationSession(session.id);

    } catch (error) {
      logger.error('Error starting conversation', {
        userId: data.userId,
        lessonId: data.lessonId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Send a message in an existing conversation
   */
  async sendMessage(data: SendMessageData): Promise<{
    userMessage: any;
    aiResponse: any;
    session: ConversationSession;
  }> {
    try {
      // Get session with full context
      const session = await this.getConversationSession(data.sessionId);
      
      if (!session) {
        throw new Error('Conversation session not found');
      }

      if (session.userId !== data.userId) {
        throw new Error('Unauthorized access to conversation');
      }

      if (session.status !== 'active') {
        throw new Error('Conversation session is not active');
      }

      // Save user's message
      const userMessage = await prisma.conversationMessage.create({
        data: {
          sessionId: data.sessionId,
          sender: 'user',
          content: data.message,
          corrections: null as any
        }
      });

      // Prepare conversation history for AI
      const conversationHistory = session.messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Generate AI response
      const lessonContext = {
        title: session.scenario.lesson.title,
        objectives: session.scenario.lesson.learningObjectives,
        vocabulary: session.scenario.lesson.vocabulary || {},
        grammarFocus: session.scenario.lesson.grammarFocus,
        difficultyLevel: session.scenario.lesson.difficultyLevel,
        scenarioType: session.scenario.lesson.scenarioType
      };

      const aiResponse = await this.openAIService.generateTeacherResponse(
        data.message,
        conversationHistory,
        session.scenario.aiPersona,
        lessonContext
      );

      // Save AI's response
      const aiMessage = await prisma.conversationMessage.create({
        data: {
          sessionId: data.sessionId,
          sender: 'ai',
          content: aiResponse.message,
          corrections: (aiResponse.corrections || null) as any
        }
      });

      // Update session statistics
      await prisma.conversationSession.update({
        where: { id: data.sessionId },
        data: {
          messagesCount: { increment: 2 }, // User message + AI response
          durationSeconds: Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
        }
      });

      logger.info('Message exchanged in conversation', {
        sessionId: data.sessionId,
        userId: data.userId,
        messageLength: data.message.length,
        hasCorrections: !!aiResponse.corrections?.length
      });

      // Return updated session
      const updatedSession = await this.getConversationSession(data.sessionId);

      return {
        userMessage: {
          ...userMessage,
          corrections: (aiResponse.corrections || null) as any
        },
        aiResponse: {
          ...aiMessage,
          suggestions: aiResponse.suggestions || null
        },
        session: updatedSession
      };

    } catch (error) {
      logger.error('Error sending message', {
        sessionId: data.sessionId,
        userId: data.userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * End a conversation session and provide evaluation
   */
  async endConversation(sessionId: string, userId: string): Promise<{
    session: ConversationSession;
    evaluation: any;
  }> {
    try {
      const session = await this.getConversationSession(sessionId);
      
      if (!session || session.userId !== userId) {
        throw new Error('Conversation session not found or unauthorized');
      }

      // Generate conversation evaluation
      const conversationHistory = session.messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      const lessonContext = {
        title: session.scenario.lesson.title,
        objectives: session.scenario.lesson.learningObjectives,
        vocabulary: session.scenario.lesson.vocabulary || {},
        grammarFocus: session.scenario.lesson.grammarFocus,
        difficultyLevel: session.scenario.lesson.difficultyLevel,
        scenarioType: session.scenario.lesson.scenarioType
      };

      const evaluation = await this.openAIService.evaluateConversation(
        conversationHistory,
        lessonContext
      );

      // Update session with final evaluation
      const updatedSession = await prisma.conversationSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          durationSeconds: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
          score: evaluation,
          feedback: `Overall Score: ${evaluation.overallScore}% - ${evaluation.feedback.strengths.join(', ')}`
        },
        include: {
          scenario: {
            include: {
              lesson: true
            }
          },
          messages: {
            orderBy: { timestamp: 'asc' }
          }
        }
      });

      // Update user progress if this was a good conversation (score >= 70)
      if (evaluation.overallScore >= 70) {
        await this.learningService.updateProgress({
          userId,
          lessonId: session.scenario.lesson.id,
          status: 'completed',
          score: evaluation.overallScore,
          timeSpent: updatedSession.durationSeconds
        });
      }

      logger.info('Conversation ended', {
        sessionId,
        userId,
        duration: updatedSession.durationSeconds,
        messagesCount: updatedSession.messagesCount,
        score: evaluation.overallScore
      });

      return {
        session: updatedSession as ConversationSession,
        evaluation
      };

    } catch (error) {
      logger.error('Error ending conversation', {
        sessionId,
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get conversation session with full details
   */
  async getConversationSession(sessionId: string): Promise<ConversationSession> {
    const session = await prisma.conversationSession.findUnique({
      where: { id: sessionId },
      include: {
        scenario: {
          include: {
            lesson: true
          }
        },
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!session) {
      throw new Error('Conversation session not found');
    }

    if (!session.scenario.lesson) {
      throw new Error('Conversation session has no associated lesson');
    }

    return session as ConversationSession;
  }

  /**
   * Get user's conversation history
   */
  async getUserConversationHistory(userId: string, limit: number = 10): Promise<ConversationSession[]> {
    const sessions = await prisma.conversationSession.findMany({
      where: { userId },
      include: {
        scenario: {
          include: {
            lesson: {
              include: {
                path: true
              }
            }
          }
        },
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: limit
    });

    return sessions.filter(session => session.scenario.lesson !== null) as ConversationSession[];
  }

  /**
   * Create default scenario for lesson if none exists
   */
  private async createDefaultScenario(lesson: any) {
    const defaultPersona = {
      id: 'default-teacher',
      name: 'Sarah Johnson',
      role: 'English Teacher',
      personality: 'Friendly, patient, and encouraging',
      accent: 'american',
      specialties: ['conversation', 'grammar', 'vocabulary'],
      adaptability: 4
    };

    const defaultSuccessCriteria = {
      minExchanges: 8,
      useTargetVocab: 3,
      correctGrammar: 0.7,
      completionGoals: [
        'Complete the practice scenario',
        'Use target vocabulary naturally',
        'Maintain conversation flow'
      ]
    };

    return await prisma.conversationScenario.create({
      data: {
        lessonId: lesson.id,
        name: `${lesson.title} Practice`,
        context: `Practice session for ${lesson.title}. Focus on ${lesson.learningObjectives.join(', ')}.`,
        aiPersona: defaultPersona,
        successCriteria: defaultSuccessCriteria,
        maxDuration: 1800 // 30 minutes
      },
      include: {
        lesson: true
      }
    });
  }
}