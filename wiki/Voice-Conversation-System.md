# Voice Conversation System

This document provides comprehensive documentation of the real-time voice conversation system in EnglishAI Master, including speech recognition, text-to-speech synthesis, and WebSocket-based real-time communication.

## 🎙️ System Overview

The voice conversation system enables seamless, real-time voice interactions between users and AI teachers, providing a natural language learning experience with immediate feedback and corrections.

### Architecture Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   OpenAI API    │
│                 │    │                 │    │                 │
│ • Speech Recognition │◄──►│ • WebSocket Handler │◄──►│ • Whisper (STT)  │
│ • Audio Recording    │    │ • Voice Service     │    │ • GPT-4 (Chat)   │
│ • Audio Playback     │    │ • Conversation Mgmt │    │ • TTS (Speech)   │
│ • UI Controls        │    │ • Session Management│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  WebSocket      │
                    │  Connection     │
                    │                 │
                    │ • Real-time     │
                    │ • Bidirectional │
                    │ • Audio Streaming│
                    └─────────────────┘
```

## 🔧 Frontend Implementation

### Speech Recognition Hook

The `useSpeechRecognition` hook provides comprehensive speech recognition and text-to-speech functionality.

```typescript
// apps/web/src/hooks/useSpeechRecognition.ts
interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const { continuous = true, interimResults = true, language = 'en-US' } = options;

  // Browser support detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.lang = language;

      // Event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
        setInterimTranscript(interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition');
    }
  }, [continuous, interimResults, language, isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Text-to-speech functionality
  const speak = useCallback((text: string, options?: { 
    rate?: number; 
    pitch?: number; 
    volume?: number;
    voice?: string;
  }) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate || 1;
      utterance.pitch = options?.pitch || 1;
      utterance.volume = options?.volume || 1;
      utterance.lang = language;

      // Voice selection
      if (options?.voice) {
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => 
          voice.name.includes(options.voice!) || 
          voice.lang.includes(options.voice!)
        );
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech not supported in this browser');
    }
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  return {
    // Speech Recognition
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    
    // Text-to-Speech
    speak,
    stopSpeaking,
    isSpeechSynthesisSupported: 'speechSynthesis' in window,
  };
}
```

### Voice Conversation Component

The `VoiceConversation` component integrates all voice features with the lesson system.

```typescript
// apps/web/src/components/conversation/VoiceConversation.tsx
interface VoiceConversationProps {
  lessonData: {
    id: string;
    title: string;
    scenarioType: string;
    learningObjectives: string[];
    vocabulary: Record<string, string>;
    grammarFocus: string[];
  };
  teacherProfile?: TeacherProfile;
  onProgress?: (progress: LessonProgress) => void;
}

export const VoiceConversation: React.FC<VoiceConversationProps> = ({
  lessonData,
  teacherProfile,
  onProgress
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioQueue, setAudioQueue] = useState<AudioQueueItem[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  
  const { activeTeacher } = useActiveTeacher();
  const teacher = teacherProfile || activeTeacher;

  // Speech recognition with lesson-specific configuration
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    speak,
    error: speechError
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    language: 'en-US'
  });

  // WebSocket connection for real-time features
  const { socket, isConnected } = useSocket('/voice-conversation', {
    query: { lessonId: lessonData.id }
  });

  // Audio playback queue management
  const playAudioQueue = useCallback(async () => {
    if (audioQueue.length === 0 || currentAudioIndex >= audioQueue.length) return;

    const currentAudio = audioQueue[currentAudioIndex];
    
    try {
      // Convert base64 to audio blob and play
      const audioBlob = base64ToBlob(currentAudio.audio, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setCurrentAudioIndex(prev => prev + 1);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Audio playback error:', error);
      setCurrentAudioIndex(prev => prev + 1);
    }
  }, [audioQueue, currentAudioIndex]);

  // Effect to play audio queue
  useEffect(() => {
    playAudioQueue();
  }, [playAudioQueue]);

  // Handle speech recognition results
  useEffect(() => {
    if (transcript.trim() && !isListening) {
      handleUserMessage(transcript.trim());
      resetTranscript();
    }
  }, [transcript, isListening]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('sentence_stream', (data: SentenceStreamData) => {
      // Update UI with streaming text
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.sender === 'ai' && lastMessage.isStreaming) {
          const updatedMessage = {
            ...lastMessage,
            content: lastMessage.content + ' ' + data.text,
            isLast: data.isLast
          };
          return [...prev.slice(0, -1), updatedMessage];
        } else {
          return [...prev, {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            content: data.text,
            timestamp: new Date(),
            isStreaming: !data.isLast,
            isLast: data.isLast
          }];
        }
      });
    });

    socket.on('sentence_audio', (data: SentenceAudioData) => {
      // Add audio to playback queue
      setAudioQueue(prev => [...prev, {
        text: data.text,
        audio: data.audio,
        index: data.index
      }]);
    });

    socket.on('transcription', (data: TranscriptionData) => {
      // Handle transcription result
      handleUserMessage(data.text);
    });

    socket.on('error', (error: string) => {
      console.error('WebSocket error:', error);
      setError(error);
    });

    return () => {
      socket.off('sentence_stream');
      socket.off('sentence_audio');
      socket.off('transcription');
      socket.off('error');
    };
  }, [socket]);

  const handleUserMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);
    
    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Send message via WebSocket for real-time processing
      if (socket && isConnected) {
        socket.emit('text_message', {
          message,
          lessonData,
          teacherProfile: teacher,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        });
      } else {
        // Fallback to HTTP API
        const response = await fetch('/api/voice/lesson-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            lessonData,
            teacherProfile: teacher,
            conversationHistory: messages.slice(-10)
          })
        });

        const data = await response.json();
        
        if (data.success) {
          // Add AI response
          const aiMessage: ConversationMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            content: data.data.text,
            timestamp: new Date(),
            corrections: data.data.corrections,
            suggestions: data.data.suggestions
          };
          
          setMessages(prev => [...prev, aiMessage]);
          
          // Generate and play speech
          if (teacher?.voiceConfig?.voice) {
            generateAndPlaySpeech(data.data.text, teacher.voiceConfig);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAndPlaySpeech = async (text: string, voiceConfig: VoiceConfig) => {
    try {
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: voiceConfig.voice,
          speed: voiceConfig.speed || 1.0
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Play generated audio
        const audioBlob = base64ToBlob(data.data.audio, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        await audio.play();
      }
    } catch (error) {
      console.error('TTS generation error:', error);
      // Fallback to browser TTS
      speak(text, { 
        rate: voiceConfig.speed || 1.0,
        voice: voiceConfig.voice 
      });
    }
  };

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <div className="voice-conversation-container">
      {/* Teacher Header */}
      <div className="teacher-header">
        <img 
          src={teacher?.personality?.avatarUrl} 
          alt={teacher?.name}
          className="teacher-avatar"
        />
        <div className="teacher-info">
          <h3>{teacher?.personality?.name}</h3>
          <p>{teacher?.personality?.title}</p>
        </div>
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      {/* Lesson Context */}
      <div className="lesson-context">
        <h4>{lessonData.title}</h4>
        <div className="learning-objectives">
          {lessonData.learningObjectives.map((objective, index) => (
            <span key={index} className="objective-tag">{objective}</span>
          ))}
        </div>
      </div>

      {/* Conversation Messages */}
      <div className="messages-container">
        {messages.map((message) => (
          <ConversationMessage 
            key={message.id} 
            message={message}
            showCorrections={message.sender === 'user'}
            showSuggestions={message.sender === 'ai'}
          />
        ))}
        {isProcessing && <TypingIndicator teacher={teacher} />}
      </div>

      {/* Voice Controls */}
      <div className="voice-controls">
        <VoiceVisualizer 
          isListening={isListening}
          transcript={transcript}
          interimTranscript={interimTranscript}
        />
        
        <button
          onClick={toggleVoiceRecording}
          className={`voice-button ${isListening ? 'listening' : ''}`}
          disabled={!isSupported || isProcessing}
        >
          {isListening ? (
            <MicIcon className="animate-pulse" />
          ) : (
            <MicOffIcon />
          )}
          {isListening ? 'Stop Recording' : 'Start Recording'}
        </button>

        {speechError && (
          <div className="error-message">
            {speechError}
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <ConversationProgress 
        messagesCount={messages.length}
        learningObjectives={lessonData.learningObjectives}
        timeSpent={0} // Calculate based on session start time
      />
    </div>
  );
};
```

## 🔧 Backend Implementation

### WebSocket Handler

The voice WebSocket handler manages real-time communication and audio processing.

```typescript
// apps/api/src/services/VoiceWebSocketHandler.ts
import { Server, Socket } from 'socket.io';
import { OpenAIService } from './OpenAIService';
import { VoiceService } from './VoiceService';
import { ConversationService } from './ConversationService';

interface VoiceWebSocketData {
  lessonId?: string;
  message?: string;
  audio?: string;
  format?: string;
  lessonData?: any;
  teacherProfile?: any;
  conversationHistory?: any[];
}

export class VoiceWebSocketHandler {
  private io: Server;
  private openAIService: OpenAIService;
  private voiceService: VoiceService;
  private conversationService: ConversationService;

  constructor(io: Server) {
    this.io = io;
    this.openAIService = new OpenAIService();
    this.voiceService = new VoiceService();
    this.conversationService = new ConversationService();
  }

  handleConnection(socket: Socket) {
    console.log(`Voice client connected: ${socket.id}`);

    // Handle text message
    socket.on('text_message', async (data: VoiceWebSocketData) => {
      try {
        await this.processTextMessage(socket, data);
      } catch (error) {
        console.error('Text message processing error:', error);
        socket.emit('error', 'Failed to process message');
      }
    });

    // Handle audio data
    socket.on('audio_data', async (data: VoiceWebSocketData) => {
      try {
        await this.processAudioData(socket, data);
      } catch (error) {
        console.error('Audio processing error:', error);
        socket.emit('error', 'Failed to process audio');
      }
    });

    // Handle audio end
    socket.on('audio_end', async () => {
      // Process accumulated audio data
      await this.processCompleteAudio(socket);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Voice client disconnected: ${socket.id}`);
      this.cleanup(socket);
    });
  }

  private async processTextMessage(socket: Socket, data: VoiceWebSocketData) {
    const { message, lessonData, teacherProfile, conversationHistory } = data;

    if (!message) {
      socket.emit('error', 'Message is required');
      return;
    }

    // Generate AI response
    const aiResponse = await this.openAIService.generateLessonResponse({
      userMessage: message,
      lessonData,
      teacherProfile,
      conversationHistory: conversationHistory || []
    });

    // Split response into sentences for streaming
    const sentences = this.splitIntoSentences(aiResponse.text);
    
    // Stream sentences to client
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      
      socket.emit('sentence_stream', {
        text: sentence,
        index: i,
        total: sentences.length,
        isLast: i === sentences.length - 1
      });

      // Generate audio for each sentence in parallel
      this.generateSentenceAudio(socket, sentence, i, teacherProfile?.voiceConfig);
    }
  }

  private async processAudioData(socket: Socket, data: VoiceWebSocketData) {
    const { audio, format } = data;

    if (!audio) {
      socket.emit('error', 'Audio data is required');
      return;
    }

    // Store audio chunk for processing
    if (!socket.data.audioChunks) {
      socket.data.audioChunks = [];
    }
    
    socket.data.audioChunks.push({
      audio,
      format: format || 'webm',
      timestamp: Date.now()
    });
  }

  private async processCompleteAudio(socket: Socket) {
    const audioChunks = socket.data.audioChunks;
    
    if (!audioChunks || audioChunks.length === 0) {
      socket.emit('error', 'No audio data to process');
      return;
    }

    try {
      // Combine audio chunks
      const combinedAudio = this.combineAudioChunks(audioChunks);
      
      // Transcribe using OpenAI Whisper
      const transcription = await this.voiceService.speechToText(
        combinedAudio,
        audioChunks[0].format
      );

      // Send transcription to client
      socket.emit('transcription', {
        text: transcription.text,
        confidence: transcription.confidence
      });

      // Clear audio chunks
      socket.data.audioChunks = [];

    } catch (error) {
      console.error('Audio transcription error:', error);
      socket.emit('error', 'Failed to transcribe audio');
    }
  }

  private async generateSentenceAudio(
    socket: Socket, 
    sentence: string, 
    index: number, 
    voiceConfig?: any
  ) {
    try {
      const audioResponse = await this.voiceService.textToSpeech(
        sentence,
        voiceConfig?.voice || 'nova',
        voiceConfig?.speed || 1.0
      );

      socket.emit('sentence_audio', {
        text: sentence,
        audio: audioResponse.audioBase64,
        index
      });
    } catch (error) {
      console.error('TTS generation error:', error);
      // Continue without audio for this sentence
    }
  }

  private splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting that preserves natural speech patterns
    return text
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }

  private combineAudioChunks(chunks: any[]): Buffer {
    // Combine multiple audio chunks into single buffer
    const buffers = chunks.map(chunk => 
      Buffer.from(chunk.audio, 'base64')
    );
    return Buffer.concat(buffers);
  }

  private cleanup(socket: Socket) {
    // Clean up any ongoing audio processing
    if (socket.data.audioChunks) {
      delete socket.data.audioChunks;
    }
  }
}
```

### Voice Service

The `VoiceService` handles all speech processing operations.

```typescript
// apps/api/src/services/VoiceService.ts
import OpenAI from 'openai';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export class VoiceService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async textToSpeech(
    text: string, 
    voice: string = 'nova', 
    speed: number = 1.0
  ): Promise<{ audioBase64: string; format: string }> {
    try {
      const response = await this.openai.audio.speech.create({
        model: process.env.OPENAI_TTS_MODEL || 'tts-1-hd',
        voice: voice as any,
        input: text,
        response_format: 'mp3',
        speed: Math.max(0.25, Math.min(4.0, speed))
      });

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      const audioBase64 = audioBuffer.toString('base64');

      return {
        audioBase64,
        format: 'mp3'
      };

    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw new Error('Failed to generate speech');
    }
  }

  async speechToText(
    audioBuffer: Buffer, 
    format: string = 'webm'
  ): Promise<{ text: string; confidence?: number }> {
    const tempFilePath = join(process.cwd(), 'temp', `${uuidv4()}.${format}`);

    try {
      // Write audio buffer to temporary file
      await writeFile(tempFilePath, audioBuffer);

      // Create file stream for OpenAI API
      const audioFile = await import('fs').then(fs => 
        fs.createReadStream(tempFilePath)
      );

      // Transcribe using Whisper
      const response = await this.openai.audio.transcriptions.create({
        file: audioFile as any,
        model: 'whisper-1',
        language: 'en',
        response_format: 'verbose_json'
      });

      return {
        text: response.text,
        confidence: response.segments?.[0]?.confidence
      };

    } catch (error) {
      console.error('Speech-to-text error:', error);
      throw new Error('Failed to transcribe audio');
    } finally {
      // Clean up temporary file
      try {
        await unlink(tempFilePath);
      } catch (unlinkError) {
        console.warn('Failed to delete temporary file:', unlinkError);
      }
    }
  }

  async processVoiceConversation(data: {
    userMessage: string;
    lessonData: any;
    teacherProfile: any;
    conversationHistory: any[];
    isVoiceTranscription?: boolean;
  }) {
    try {
      // Generate AI response using OpenAI service
      const openAIService = new OpenAIService();
      const aiResponse = await openAIService.generateLessonResponse(data);

      // If this was from voice transcription, generate audio response
      let audioResponse = null;
      if (data.isVoiceTranscription && data.teacherProfile?.voiceConfig) {
        audioResponse = await this.textToSpeech(
          aiResponse.text,
          data.teacherProfile.voiceConfig.voice,
          data.teacherProfile.voiceConfig.speed
        );
      }

      return {
        text: aiResponse.text,
        sentences: this.splitIntoSentences(aiResponse.text),
        corrections: aiResponse.corrections || [],
        suggestions: aiResponse.suggestions || [],
        audio: audioResponse
      };

    } catch (error) {
      console.error('Voice conversation processing error:', error);
      throw new Error('Failed to process voice conversation');
    }
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }

  // Voice configuration validation
  validateVoiceConfig(config: any): boolean {
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    
    return (
      validVoices.includes(config.voice) &&
      typeof config.speed === 'number' &&
      config.speed >= 0.25 &&
      config.speed <= 4.0
    );
  }

  // Get available voices
  getAvailableVoices() {
    return [
      { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
      { id: 'echo', name: 'Echo', description: 'Male, clear articulation' },
      { id: 'fable', name: 'Fable', description: 'Female, warm tone' },
      { id: 'onyx', name: 'Onyx', description: 'Male, deep voice' },
      { id: 'nova', name: 'Nova', description: 'Female, young and vibrant' },
      { id: 'shimmer', name: 'Shimmer', description: 'Female, soft and gentle' }
    ];
  }
}
```

## 🎛️ Voice Features

### Real-time Features
- **Streaming Speech Recognition**: Continuous voice input with interim results
- **Parallel Audio Generation**: Text and audio generated simultaneously
- **Sentence-by-Sentence Playback**: Natural conversation flow
- **WebSocket Communication**: Low-latency real-time interaction

### Audio Processing
- **High-Quality TTS**: OpenAI's TTS-HD models for natural speech
- **Multiple Voice Options**: 6 different AI voices with personality matching
- **Speed Control**: Adjustable speech rate (0.25x to 4.0x)
- **Audio Format Support**: MP3, WebM, WAV support

### Browser Compatibility
- **Chrome/Chromium**: Full support with webkit speech recognition
- **Firefox**: Limited speech recognition support
- **Safari**: Partial support, requires iOS 14.5+
- **Edge**: Full support with webkit speech recognition

### Error Handling
- **Graceful Degradation**: Fallback to text input when voice unavailable
- **Network Recovery**: Automatic reconnection on connection loss
- **Permission Handling**: Clear prompts for microphone access
- **Browser Compatibility**: Feature detection and user guidance

## 🔧 Configuration

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_TTS_MODEL=tts-1-hd
OPENAI_TTS_VOICE=nova
OPENAI_STT_MODEL=whisper-1

# Voice Service Configuration
VOICE_MAX_DURATION=300  # 5 minutes max recording
VOICE_SAMPLE_RATE=16000
VOICE_CHUNK_SIZE=1024
```

### Client Configuration
```typescript
// Voice recognition configuration
const voiceConfig = {
  continuous: true,
  interimResults: true,
  language: 'en-US',
  maxRecordingTime: 300000, // 5 minutes
  silenceTimeout: 3000, // 3 seconds
  autoStop: true
};

// TTS configuration per teacher
const teacherVoiceConfig = {
  voice: 'nova',
  speed: 1.0,
  pitch: 1.0,
  volume: 1.0,
  accent: 'american'
};
```

## 🧪 Testing Voice Features

### Unit Tests
```typescript
// __tests__/hooks/useSpeechRecognition.test.ts
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from '../useSpeechRecognition';

// Mock browser APIs
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  onresult: null,
  onerror: null,
  onstart: null,
  onend: null
};

Object.defineProperty(window, 'SpeechRecognition', {
  value: jest.fn(() => mockSpeechRecognition)
});

describe('useSpeechRecognition', () => {
  it('detects browser support', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(true);
  });

  it('starts speech recognition', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    
    act(() => {
      result.current.startListening();
    });

    expect(mockSpeechRecognition.start).toHaveBeenCalled();
  });

  it('handles recognition results', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    
    act(() => {
      result.current.startListening();
    });

    // Simulate recognition result
    const mockEvent = {
      resultIndex: 0,
      results: [{
        isFinal: true,
        0: { transcript: 'Hello world' }
      }]
    };

    act(() => {
      mockSpeechRecognition.onresult(mockEvent);
    });

    expect(result.current.transcript).toBe('Hello world');
  });
});
```

### Integration Tests
```typescript
// __tests__/api/voice.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('/api/voice', () => {
  describe('POST /tts', () => {
    it('generates speech from text', async () => {
      const response = await request(app)
        .post('/api/voice/tts')
        .send({
          text: 'Hello, this is a test',
          voice: 'nova',
          speed: 1.0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.audio).toBeDefined();
      expect(response.body.data.format).toBe('mp3');
    });
  });

  describe('POST /lesson-chat', () => {
    it('processes voice conversation', async () => {
      const response = await request(app)
        .post('/api/voice/lesson-chat')
        .send({
          message: 'I want to practice English',
          lessonData: {
            title: 'Basic Conversation',
            scenarioType: 'daily',
            learningObjectives: ['Greetings', 'Small talk']
          },
          isVoiceTranscription: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBeDefined();
      expect(response.body.data.sentences).toBeInstanceOf(Array);
    });
  });
});
```

### E2E Voice Tests
```typescript
// e2e/voice-conversation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Voice Conversation', () => {
  test('complete voice conversation flow', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);
    
    await page.goto('/learning/business-path/lesson/interview-prep');
    
    // Start voice conversation
    await page.click('[data-testid="start-voice-conversation"]');
    
    // Wait for voice interface to load
    await expect(page.locator('[data-testid="voice-controls"]')).toBeVisible();
    
    // Simulate voice input (in real test, would use actual audio)
    await page.evaluate(() => {
      window.mockSpeechRecognition.simulateResult('Hello, I want to practice');
    });
    
    // Wait for AI response
    await expect(page.locator('[data-testid="ai-message"]')).toBeVisible({ timeout: 10000 });
    
    // Verify audio playback started
    await expect(page.locator('[data-testid="audio-playing"]')).toBeVisible();
  });

  test('handles voice recognition errors gracefully', async ({ page }) => {
    await page.goto('/learning/daily-path/lesson/restaurant');
    
    // Block microphone permissions
    await page.context().clearPermissions();
    
    await page.click('[data-testid="start-voice-conversation"]');
    
    // Should show fallback to text input
    await expect(page.locator('[data-testid="text-input-fallback"]')).toBeVisible();
    await expect(page.locator('[data-testid="permission-error"]')).toBeVisible();
  });
});
```

This comprehensive voice conversation system documentation provides developers with detailed implementation guides, configuration options, and testing strategies for the real-time voice features in EnglishAI Master.