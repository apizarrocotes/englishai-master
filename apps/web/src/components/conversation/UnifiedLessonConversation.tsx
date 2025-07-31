'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Bot,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageCircle,
  X,
  Settings,
  Headphones,
  Keyboard,
  Loader2
} from 'lucide-react';
import { TokenStorage } from '@/lib/auth';
import { useActiveTeacher } from '@/hooks/useActiveTeacher';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  corrections?: {
    original: string;
    corrected: string;
    explanation: string;
    type: 'grammar' | 'vocabulary' | 'pronunciation' | 'usage';
  }[];
  suggestions?: string[];
}

interface LessonData {
  id: string;
  title: string;
  description: string;
  scenarioType: string;
  learningObjectives: string[];
  vocabulary: Record<string, string>;
  grammarFocus: string[];
  difficultyLevel: number;
  estimatedDuration: number;
}

interface ConversationMode {
  type: 'chat' | 'voice';
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface UnifiedLessonConversationProps {
  lessonId: string;
  lessonData: LessonData;
  onComplete: (evaluation: any) => void;
  onClose?: () => void;
}

// Global speech recognition interface
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const conversationModes: ConversationMode[] = [
  {
    type: 'chat',
    label: 'Text Chat',
    icon: <Keyboard className="w-5 h-5" />,
    description: 'Type your messages to practice with AI'
  },
  {
    type: 'voice',
    label: 'Voice Mode',
    icon: <Headphones className="w-5 h-5" />,
    description: 'Speak naturally with voice recognition'
  }
];

export default function UnifiedLessonConversation({
  lessonId,
  lessonData,
  onComplete,
  onClose
}: UnifiedLessonConversationProps) {
  const { activeTeacher, loading: teacherLoading } = useActiveTeacher();
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCorrections, setShowCorrections] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  // Voice-specific states
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  
  // Session tracking
  const [sessionStartTime] = useState(new Date());
  const [messageCount, setMessageCount] = useState(0);
  
  // Micro-interaction states
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [messageAnimations, setMessageAnimations] = useState<Record<string, boolean>>({});
  const [buttonHover, setButtonHover] = useState<string | null>(null);
  const [inputFocus, setInputFocus] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    initializeConversation();
    if (mode === 'voice') {
      initializeSpeechRecognition();
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [mode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeConversation = async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      // Create initial AI greeting message adapted to lesson content
      const greeting = generateContextualGreeting();
      
      const initialMessage: Message = {
        id: 'greeting',
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      };
      
      setMessages([initialMessage]);
      
      // Generate speech for greeting if in voice mode
      if (mode === 'voice' && !isMuted) {
        setTimeout(() => {
          generateSpeechForMessage(greeting);
        }, 500);
      }
      
    } catch (error) {
      console.error('Error initializing conversation:', error);
      setError('Failed to initialize conversation. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const generateContextualGreeting = (): string => {
    const { scenarioType, title, learningObjectives } = lessonData;
    
    // Use teacher's name and persona if available
    const teacherName = activeTeacher?.name || 'your AI English teacher';
    const catchPhrase = activeTeacher?.personality?.catchPhrases?.[0] || '';
    
    const greetings = {
      'Restaurant Ordering': `Hello! Welcome to our restaurant. I'm ${teacherName} and I'm here to help you practice ordering in English. Today we'll focus on "${title}". ${catchPhrase} Are you ready to start practicing?`,
      'Hotel Check-in': `Good day! Welcome to our hotel. I'm ${teacherName}. I'm here to help you practice check-in procedures in English. We'll be working on "${title}" today. How may I assist you?`,
      'Job Interview': `Hello! I'm ${teacherName}, your interviewer today. We'll be practicing interview skills for "${title}". ${catchPhrase} Are you ready to begin the interview?`,
      'Shopping': `Welcome to our store! I'm ${teacherName}, your sales assistant. Today we're practicing "${title}". What can I help you find?`,
      'Medical Appointment': `Hello, I'm ${teacherName}, your medical assistant. We'll be practicing "${title}" today. How are you feeling?`,
      'Business Meeting': `Good morning! I'm ${teacherName}, your meeting facilitator. Today we'll practice "${title}". Shall we begin our discussion?`,
      'Travel Planning': `Hello! I'm ${teacherName}, your travel consultant. Today we'll work on "${title}". Where would you like to go?`,
      'Phone Conversation': `Hello! I'm ${teacherName} calling to practice "${title}" with you. Can you hear me clearly?`
    };
    
    return greetings[scenarioType as keyof typeof greetings] || 
           `Hello! I'm ${teacherName}. Today we'll be practicing "${title}". ${catchPhrase} ${learningObjectives[0] || 'Let\'s start our conversation!'}`;
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        console.log('Speech recognized:', transcript, 'Confidence:', confidence);
        
        // Add user message
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: transcript,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setMessageCount(prev => prev + 1);
        
        // Get AI response
        sendMessageToAI(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsRecording(false);
        
        switch (event.error) {
          case 'no-speech':
            setError('No speech detected. Please try again.');
            break;
          case 'audio-capture':
            setError('Microphone not accessible. Please check permissions.');
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone access.');
            break;
          default:
            setError('Speech recognition error. Please try again.');
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  };

  const generateSpeechForMessage = async (text: string) => {
    if (isGeneratingSpeech || isPlayingAudio || isMuted) return;
    
    setIsGeneratingSpeech(true);
    
    try {
      // Try OpenAI TTS first
      const token = TokenStorage.getAccessToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://89.58.17.78:3001';
      
      const voiceConfig = {
        text: text,
        voice: activeTeacher?.voiceConfig?.voice || 'nova',
        speed: activeTeacher?.voiceConfig?.speed || 0.95
      };

      console.log('🔊 TTS Configuration:', {
        teacherName: activeTeacher?.name,
        voiceConfig,
        activeTeacher: activeTeacher ? 'loaded' : 'not loaded'
      });

      const ttsResponse = await fetch(`${apiUrl}/api/voice/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voiceConfig),
      });

      console.log('📡 TTS Response status:', ttsResponse.status);
      console.log('📡 TTS Response ok:', ttsResponse.ok);

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        console.log('✅ OpenAI TTS successful, using OpenAI audio');
        const audioBlob = new Blob([Uint8Array.from(atob(ttsData.data.audio), c => c.charCodeAt(0))], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setIsPlayingAudio(true);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlayingAudio(false);
          setIsGeneratingSpeech(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          setIsGeneratingSpeech(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
        return;
      } else {
        const errorText = await ttsResponse.text();
        console.error('❌ OpenAI TTS failed:', ttsResponse.status, errorText);
      }
    } catch (error) {
      console.warn('OpenAI TTS failed, falling back to browser synthesis:', error);
    }

    // Fallback to browser speech synthesis
    console.warn('⚠️ Falling back to browser speech synthesis (Web Speech API)');
    try {
      if ('speechSynthesis' in window) {
        setIsPlayingAudio(true);
        
        let voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
          await new Promise(resolve => {
            speechSynthesis.onvoiceschanged = () => {
              voices = speechSynthesis.getVoices();
              resolve(voices);
            };
          });
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Samantha') || 
          voice.name.includes('Google US English') ||
          (voice.lang.startsWith('en-US') && voice.name.includes('Female'))
        ) || voices.find(voice => voice.lang.startsWith('en-US')) || voices[0];
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onend = () => {
          setIsPlayingAudio(false);
          setIsGeneratingSpeech(false);
        };
        utterance.onerror = () => {
          setIsPlayingAudio(false);
          setIsGeneratingSpeech(false);
        };
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      setIsPlayingAudio(false);
      setIsGeneratingSpeech(false);
    }
  };

  const sendMessageToAI = async (userText: string) => {
    setIsProcessing(true);
    setTypingIndicator(true);
    
    try {
      // Add a slight delay for better UX perception
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate contextual AI response based on lesson content
      const aiResponse = await generateContextualAIResponse(userText);
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiResponse.text,
        timestamp: new Date(),
        corrections: aiResponse.corrections,
        suggestions: aiResponse.suggestions
      };
      
      // Add message with animation trigger
      setMessages(prev => [...prev, aiMessage]);
      setMessageAnimations(prev => ({ ...prev, [aiMessage.id]: true }));
      setMessageCount(prev => prev + 1);
      
      // Generate speech for AI response in voice mode
      if (mode === 'voice' && !isMuted) {
        generateSpeechForMessage(aiResponse.text);
      }
      
      // Check if conversation should end (but don't auto-end, let user decide)
      // Removed auto-end to prevent unwanted API calls
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      setError('Failed to get AI response. Please try again.');
    } finally {
      setIsProcessing(false);
      setTypingIndicator(false);
    }
  };

  const generateContextualAIResponse = async (userMessage: string): Promise<{
    text: string;
    corrections?: any[];
    suggestions?: string[];
  }> => {
    try {
      // Use the backend API for intelligent responses
      const token = TokenStorage.getAccessToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://89.58.17.78:3001';
      
      const response = await fetch(`${apiUrl}/api/voice/lesson-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          lessonData: lessonData,
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
          teacherProfile: activeTeacher // Send the active teacher profile for persona
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          text: data.data.text,
          corrections: data.data.corrections,
          suggestions: data.data.suggestions
        };
      }
    } catch (error) {
      console.warn('API call failed, falling back to local responses:', error);
    }

    // Fallback to local pattern matching
    const lowerMessage = userMessage.toLowerCase();
    const { scenarioType, vocabulary, grammarFocus } = lessonData;
    
    const responses = {
      'Restaurant Ordering': {
        greetings: [`Great! I can see you're ready to practice ordering. Here's our menu for today. What catches your eye?`, `Perfect! Let's start with our specials. Are you looking for something specific?`],
        menu: [`Excellent choice! We have pasta, steaks, seafood, and vegetarian options. What sounds good to you?`, `Our menu features ${Object.keys(vocabulary).slice(0, 3).join(', ')}. What would you like to try?`],
        order: [`Great selection! How would you like that prepared? And would you like any sides?`, `Perfect! I'll get that started for you. Any drinks or appetizers?`],
        questions: [`That's a great question! Let me tell you more about that dish...`, `I'd be happy to help with that. Here's what I recommend...`]
      },
      'Hotel Check-in': {
        greetings: [`Welcome! I have your reservation here. May I have your ID and confirmation number?`, `Good to see you! Let's get you checked in. Do you have your booking details?`],
        checkin: [`Perfect! Your room is ready. Here are your key cards. The elevators are to your right.`, `Excellent! You're all set. Your room includes ${Object.keys(vocabulary).slice(0, 2).join(' and ')}. Enjoy your stay!`],
        questions: [`I'd be happy to help with that. Our ${Object.keys(vocabulary)[Math.floor(Math.random() * Object.keys(vocabulary).length)]} is available.`, `Great question! Let me provide you with that information...`]
      }
    };
    
    const scenarioResponses = responses[scenarioType as keyof typeof responses];
    let responseText = "I understand. Can you tell me more about that?";
    
    if (scenarioResponses) {
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('good')) {
        responseText = scenarioResponses.greetings[Math.floor(Math.random() * scenarioResponses.greetings.length)];
      } else if (lowerMessage.includes('menu') || lowerMessage.includes('what') || lowerMessage.includes('have')) {
        responseText = scenarioResponses.menu?.[Math.floor(Math.random() * scenarioResponses.menu.length)] || responseText;
      } else if (lowerMessage.includes('want') || lowerMessage.includes('like') || lowerMessage.includes('order')) {
        responseText = scenarioResponses.order?.[Math.floor(Math.random() * scenarioResponses.order.length)] || responseText;
      } else if (lowerMessage.includes('?')) {
        responseText = scenarioResponses.questions[Math.floor(Math.random() * scenarioResponses.questions.length)];
      }
    }
    
    return { text: responseText };
  };

  const startRecording = async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available.');
      return;
    }

    try {
      setError(null);
      setIsRecording(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Failed to start speech recognition. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendTextMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userText = inputMessage.trim();
    setInputMessage('');
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date()
    };
    
    // Add user message with animation trigger
    setMessages(prev => [...prev, userMessage]);
    setMessageAnimations(prev => ({ ...prev, [userMessage.id]: true }));
    setMessageCount(prev => prev + 1);
    
    // Focus back to input for continuous typing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    
    await sendMessageToAI(userText);
  };

  const endConversation = () => {
    const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
    const score = Math.min(100, Math.max(60, messageCount * 8 + (duration > 300 ? 20 : 10)));
    
    const evaluation = {
      overallScore: score,
      messagesExchanged: messageCount,
      duration: duration,
      vocabUsed: Object.keys(lessonData.vocabulary).length,
      completionStatus: score >= 70 ? 'completed' : 'in_progress'
    };
    
    onComplete(evaluation);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isInitializing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Initializing lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
      {/* Header with mode toggle */}
      <div className="border-b p-4 bg-blue-50 rounded-t-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Teacher</h3>
              <p className="text-sm text-gray-600">{lessonData.scenarioType} • {lessonData.title}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {mode === 'voice' && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg ${isMuted ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'} hover:bg-opacity-80`}
                title={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            
            <button
              onClick={() => setShowCorrections(!showCorrections)}
              className={`p-2 rounded-lg ${showCorrections ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} hover:bg-opacity-80`}
              title="Toggle corrections"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex bg-white rounded-lg p-1 space-x-1">
          {conversationModes.map((modeOption) => (
            <button
              key={modeOption.type}
              onClick={() => setMode(modeOption.type)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === modeOption.type
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title={modeOption.description}
            >
              {modeOption.icon}
              <span>{modeOption.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ 
                duration: 0.3,
                delay: index === messages.length - 1 ? 0.1 : 0,
                ease: "easeOut"
              }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] flex items-start space-x-2 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-green-100 text-green-600'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <motion.div 
                    className={`rounded-2xl px-4 py-2 cursor-pointer transition-all duration-200 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-md'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </motion.div>
                  
                  {/* Corrections */}
                  {showCorrections && message.corrections && message.corrections.length > 0 && (
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-2">💡 Corrections:</p>
                      {message.corrections.map((correction, idx) => (
                        <div key={idx} className="text-sm text-yellow-700 mb-1">
                          <span className="line-through">{correction.original}</span> → 
                          <span className="font-medium ml-1">{correction.corrected}</span>
                          <p className="text-xs text-yellow-600 mt-1">{correction.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">💭 Suggestions:</p>
                      {message.suggestions.map((suggestion, idx) => (
                        <p key={idx} className="text-sm text-blue-700 mb-1">• {suggestion}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {(isProcessing || typingIndicator) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-start"
          >
            <div className="flex items-center space-x-2">
              <motion.div 
                className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Bot className="w-4 h-4 text-green-600" />
              </motion.div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  {typingIndicator ? (
                    <div className="flex space-x-1">
                      <motion.div
                        className="w-2 h-2 bg-gray-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                    </div>
                  ) : (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          {mode === 'voice' && (
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`p-3 rounded-full transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50`}
              whileHover={isProcessing ? {} : { scale: 1.1 }}
              whileTap={isProcessing ? {} : { scale: 0.9 }}
              animate={{
                scale: isRecording ? [1, 1.1, 1] : 1,
                boxShadow: isRecording 
                  ? '0 0 20px rgba(239, 68, 68, 0.6)'
                  : '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
              transition={{
                scale: {
                  duration: 1,
                  repeat: isRecording ? Infinity : 0,
                  ease: "easeInOut"
                }
              }}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </motion.button>
          )}

          <div className="flex-1">
            <motion.input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
              onFocus={() => setInputFocus(true)}
              onBlur={() => setInputFocus(false)}
              placeholder={mode === 'voice' ? "Voice mode active - click mic to speak" : "Type your message..."}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg transition-all duration-200 ${
                inputFocus 
                  ? 'ring-2 ring-blue-500 border-transparent shadow-lg' 
                  : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              }`}
              disabled={isProcessing || (mode === 'voice' && isRecording)}
              whileFocus={{ scale: 1.02 }}
              animate={{ 
                borderColor: inputFocus ? '#3B82F6' : '#D1D5DB',
                boxShadow: inputFocus ? '0 10px 25px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>

          {mode === 'chat' && (
            <motion.button
              onClick={sendTextMessage}
              disabled={!inputMessage.trim() || isProcessing}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                !inputMessage.trim() || isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
              }`}
              whileHover={!inputMessage.trim() || isProcessing ? {} : { scale: 1.05 }}
              whileTap={!inputMessage.trim() || isProcessing ? {} : { scale: 0.95 }}
              animate={{
                backgroundColor: !inputMessage.trim() || isProcessing ? '#D1D5DB' : '#16A34A'
              }}
            >
              <motion.div
                animate={{
                  rotate: isProcessing ? 360 : 0
                }}
                transition={{
                  duration: 1,
                  repeat: isProcessing ? Infinity : 0,
                  ease: "linear"
                }}
              >
                <Send className="w-5 h-5" />
              </motion.div>
            </motion.button>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <MessageCircle className="w-3 h-3 mr-1" />
              <span>{messageCount} messages</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60)}m</span>
            </div>
            {mode === 'voice' && (
              <div className="flex items-center">
                {isListening ? (
                  <span className="text-red-600 animate-pulse">🎤 Listening...</span>
                ) : isPlayingAudio ? (
                  <span className="text-green-600">🔊 AI Speaking...</span>
                ) : (
                  <span>🎙️ Voice Ready</span>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={endConversation}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Complete Lesson
          </button>
        </div>
      </div>
    </div>
  );
}