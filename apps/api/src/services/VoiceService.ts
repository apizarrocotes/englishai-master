import OpenAI from 'openai';
import { logger } from '@/utils/logger';
import { ConversationService } from './ConversationService';
import { LearningService } from './LearningService';

interface VoiceSession {
  id: string;
  userId: string;
  lessonId: string;
  conversationId?: string;
  audioBuffer: Buffer[];
  createdAt: Date;
  lastActivity: Date;
}

interface AudioProcessingResult {
  transcription?: string;
  confidence?: number;
}

interface AIResponse {
  text: string;
  context?: any;
}

interface TTSResult {
  audioBase64: string;
  format: string;
}

export class VoiceService {
  private openai?: OpenAI;
  private conversationService: ConversationService;
  private learningService: LearningService;
  private activeSessions: Map<string, VoiceSession> = new Map();
  private whisperModel: string;
  private ttsModel: string;
  private ttsVoice: string;
  private audioCache: Map<string, TTSResult> = new Map();

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      logger.warn('OPENAI_API_KEY not configured, voice features will be limited');
    }
    this.conversationService = new ConversationService();
    this.learningService = new LearningService();
    
    // Configure models from environment variables with fallbacks
    this.whisperModel = process.env.OPENAI_WHISPER_MODEL || 'whisper-1';
    this.ttsModel = process.env.OPENAI_TTS_MODEL || 'tts-1';
    this.ttsVoice = process.env.OPENAI_TTS_VOICE || 'nova';
  }

  async createVoiceSession(userId: string, lessonId: string): Promise<VoiceSession> {
    const sessionId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Get lesson details for context
      const lesson = await this.learningService.getLessonById(lessonId);
      
      // Create conversation session
      const conversation = await this.conversationService.getConversationSession(userId);

      const session: VoiceSession = {
        id: sessionId,
        userId,
        lessonId,
        conversationId: conversation.id,
        audioBuffer: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };

      this.activeSessions.set(sessionId, session);
      
      logger.info('Voice session created', {
        sessionId,
        userId,
        lessonId,
        conversationId: conversation.id
      });

      return session;
    } catch (error) {
      logger.error('Failed to create voice session', {
        error: (error as Error).message,
        userId,
        lessonId
      });
      throw error;
    }
  }

  async processAudioChunk(sessionId: string, audioBase64: string, format: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Voice session not found');
    }

    try {
      // Convert base64 to buffer and accumulate
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      session.audioBuffer.push(audioBuffer);
      session.lastActivity = new Date();

      logger.debug('Audio chunk processed', {
        sessionId,
        chunkSize: audioBuffer.length,
        totalChunks: session.audioBuffer.length
      });
    } catch (error) {
      logger.error('Failed to process audio chunk', {
        error: (error as Error).message,
        sessionId
      });
      throw error;
    }
  }

  async finalizeAudioProcessing(sessionId: string): Promise<AudioProcessingResult> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Voice session not found');
    }

    try {
      if (session.audioBuffer.length === 0) {
        return { transcription: '', confidence: 0 };
      }

      // Combine all audio chunks
      const completeAudio = Buffer.concat(session.audioBuffer);
      
      // Clear the buffer
      session.audioBuffer = [];

      // Convert to speech using OpenAI Whisper
      const transcription = await this.speechToTextInternal(completeAudio, 'webm');
      
      logger.info('Audio transcription completed', {
        sessionId,
        transcription: transcription.transcription,
        confidence: transcription.confidence
      });

      return transcription;
    } catch (error) {
      logger.error('Failed to finalize audio processing', {
        error: (error as Error).message,
        sessionId
      });
      throw error;
    }
  }

  async speechToText(audioBase64: string, format: string): Promise<AudioProcessingResult> {
    try {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      return await this.speechToTextInternal(audioBuffer, format);
    } catch (error) {
      logger.error('Speech to text failed', { error: (error as Error).message });
      throw error;
    }
  }

  private async speechToTextInternal(audioBuffer: Buffer, format: string): Promise<AudioProcessingResult> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI API not configured');
      }

      // Create a temporary file-like object for OpenAI API
      const audioFile = new File([audioBuffer], `audio.${format}`, {
        type: `audio/${format}`
      });

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: this.whisperModel,
        language: 'en',
        response_format: 'verbose_json'
      });

      return {
        transcription: transcription.text,
        confidence: transcription.segments ? 
          transcription.segments.reduce((acc, seg) => acc + (seg.avg_logprob || 0), 0) / transcription.segments.length :
          0.8 // Default confidence if segments not available
      };
    } catch (error) {
      logger.error('OpenAI Whisper transcription failed', { error: (error as Error).message });
      throw new Error('Speech recognition failed');
    }
  }

  async generateAIResponse(sessionId: string, userMessage: string): Promise<AIResponse> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Voice session not found');
    }

    try {
      if (!session.conversationId) {
        throw new Error('No conversation session found');
      }

      // Send message through conversation service
      const response = await this.conversationService.sendMessage({
        sessionId: session.conversationId,
        userId: session.userId,
        message: userMessage,
        isTranscription: true
      });

      logger.info('AI response generated for voice session', {
        sessionId,
        userMessage,
        aiResponse: response.aiResponse
      });

      return {
        text: response.aiResponse,
        context: response
      };
    } catch (error) {
      logger.error('Failed to generate AI response', {
        error: (error as Error).message,
        sessionId,
        userMessage
      });
      throw error;
    }
  }

  async textToSpeech(text: string, voice: string = 'alloy', speed: number = 1.0): Promise<TTSResult> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI API not configured');
      }

      // Check cache first
      const cacheKey = `${text}_${voice}_${speed}`;
      if (this.audioCache.has(cacheKey)) {
        logger.info('VoiceService.textToSpeech - cache hit', { cacheKey });
        return this.audioCache.get(cacheKey)!;
      }

      logger.info('VoiceService.textToSpeech - starting TTS', {
        voice: voice,
        speed: speed,
        textLength: text.length,
        textPreview: text.substring(0, 50) + '...'
      });

      // Validate voice option
      const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      const originalVoice = voice;
      if (!validVoices.includes(voice)) {
        voice = 'alloy';
        logger.warn('Invalid voice provided, using fallback', {
          originalVoice,
          fallbackVoice: voice
        });
      }

      // Validate speed
      const originalSpeed = speed;
      if (speed < 0.25 || speed > 4.0) {
        speed = 1.0;
        logger.warn('Invalid speed provided, using fallback', {
          originalSpeed,
          fallbackSpeed: speed
        });
      }

      logger.info('VoiceService.textToSpeech - calling OpenAI TTS', {
        model: this.ttsModel,
        voice: voice,
        speed: speed,
        validVoices: validVoices
      });

      const mp3 = await this.openai.audio.speech.create({
        model: this.ttsModel,
        voice: voice as any,
        input: text,
        speed: speed,
        response_format: 'mp3'
      });

      // Convert response to buffer
      const buffer = Buffer.from(await mp3.arrayBuffer());
      const audioBase64 = buffer.toString('base64');

      const result = {
        audioBase64,
        format: 'mp3'
      };

      // Cache the result for future use
      this.audioCache.set(cacheKey, result);
      
      // Limit cache size to prevent memory issues
      if (this.audioCache.size > 100) {
        const firstKey = this.audioCache.keys().next().value;
        if (firstKey) {
          this.audioCache.delete(firstKey);
        }
      }

      logger.info('VoiceService.textToSpeech - conversion completed successfully', {
        textLength: text.length,
        finalVoice: voice,
        finalSpeed: speed,
        audioSize: buffer.length,
        ttsModel: this.ttsModel,
        cached: true
      });

      return result;
    } catch (error) {
      logger.error('Text to speech failed', { 
        error: (error as Error).message,
        text: text.substring(0, 100) + '...',
        voice,
        speed
      });
      throw new Error('Text to speech conversion failed');
    }
  }

  async endVoiceSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return;
    }

    try {
      // End conversation session if exists
      if (session.conversationId) {
        await this.conversationService.endConversation(session.conversationId, session.userId);
      }

      // Clean up session
      this.activeSessions.delete(sessionId);

      logger.info('Voice session ended', {
        sessionId,
        userId: session.userId,
        lessonId: session.lessonId,
        duration: Date.now() - session.createdAt.getTime()
      });
    } catch (error) {
      logger.error('Failed to end voice session', {
        error: (error as Error).message,
        sessionId
      });
    }
  }

  // Cleanup inactive sessions (call this periodically)
  cleanupInactiveSessions(): void {
    const now = new Date();
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > maxInactiveTime) {
        this.endVoiceSession(sessionId);
        logger.info('Cleaned up inactive voice session', { sessionId });
      }
    }
  }

  // Split text into sentences for streaming
  private splitIntoSentences(text: string): string[] {
    // More robust sentence splitting
    const sentences = text
      // Split on sentence endings (.!?) optionally followed by quotes/parentheses, then whitespace and capital letter
      .split(/(?<=[.!?])["']?\s+(?=[A-Z])/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
    
    // Handle cases where sentences might be too short - combine very short ones
    const optimizedSentences: string[] = [];
    
    for (const sentence of sentences) {
      // Only combine if sentence is extremely short (< 10 chars) 
      if (sentence.length < 10 && optimizedSentences.length > 0) {
        // Combine with the last sentence
        optimizedSentences[optimizedSentences.length - 1] += ' ' + sentence;
      } else {
        optimizedSentences.push(sentence);
      }
    }
    
    logger.info('Sentence splitting result', {
      originalLength: text.length,
      totalSentences: optimizedSentences.length,
      sentences: optimizedSentences.map(s => s.substring(0, 30) + '...')
    });
    
    return optimizedSentences;
  }

  // Generate streaming response with audio for each sentence
  async generateStreamingResponse(sessionId: string, userMessage: string, sendCallback: (type: string, data: any) => void): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Voice session not found');
    }

    try {
      if (!session.conversationId) {
        throw new Error('No conversation session found');
      }

      // Generate AI response
      const response = await this.conversationService.sendMessage({
        sessionId: session.conversationId,
        userId: session.userId,
        message: userMessage,
        isTranscription: true
      });

      // Split response into sentences
      const sentences = this.splitIntoSentences(response.aiResponse);
      
      logger.info('Streaming response in sentences', {
        sessionId,
        originalText: response.aiResponse,
        totalSentences: sentences.length,
        sentences: sentences.map((s, i) => `${i+1}: ${s.substring(0, 50)}...`)
      });

      // Send sentences progressively
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        
        // Send text immediately
        sendCallback('sentence_stream', {
          text: sentence,
          index: i,
          total: sentences.length,
          isLast: i === sentences.length - 1
        });

        // Generate audio for this sentence in parallel (non-blocking)
        this.textToSpeech(sentence).then(audioResponse => {
          sendCallback('sentence_audio', {
            text: sentence,
            audio: audioResponse.audioBase64,
            index: i,
            total: sentences.length,
            isLast: i === sentences.length - 1
          });
        }).catch(error => {
          logger.error('Error generating audio for sentence', { 
            error: error.message, 
            sessionId, 
            sentenceIndex: i 
          });
        });

        // Small delay between sentences for natural pacing
        if (i < sentences.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

    } catch (error) {
      logger.error('Failed to generate streaming response', {
        error: (error as Error).message,
        sessionId,
        userMessage
      });
      throw error;
    }
  }

  // Get session statistics
  getSessionStats(): any {
    return {
      activeSessions: this.activeSessions.size,
      sessions: Array.from(this.activeSessions.values()).map(session => ({
        id: session.id,
        userId: session.userId,
        lessonId: session.lessonId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        bufferSize: session.audioBuffer.length
      }))
    };
  }
}