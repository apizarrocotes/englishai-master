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
  X
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useUser } from '@/stores/authStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface Message {
  id: string;
  sender: 'user' | 'ai';
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

interface ConversationSession {
  id: string;
  status: 'active' | 'completed';
  scenario: {
    name: string;
    context: string;
    aiPersona: {
      name: string;
      role: string;
      personality: string;
    };
    lesson: {
      title: string;
      learningObjectives: string[];
      vocabulary: Record<string, string>;
      grammarFocus: string[];
      difficultyLevel: number;
    };
  };
  messagesCount: number;
  durationSeconds: number;
}

interface AIConversationProps {
  lessonId: string;
  onClose: () => void;
  onComplete: (evaluation: any) => void;
}

export default function AIConversation({ lessonId, onClose, onComplete }: AIConversationProps) {
  const user = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [showCorrections, setShowCorrections] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const socket = useSocket({ autoConnect: true });
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    speak,
    isSupported: isSpeechSupported,
    isSpeechSynthesisSupported
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    language: 'en-US'
  });

  useEffect(() => {
    if (socket.isConnected) {
      setupSocketListeners();
      startConversation();
    } else {
      socket.connect();
    }

    return () => {
      cleanupSocketListeners();
      if (session?.id) {
        socket.leaveConversation(session.id);
      }
    };
  }, [socket.isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-fill input with speech recognition result
    if (transcript && !isListening) {
      setInputMessage(prevMessage => {
        const newMessage = prevMessage + ' ' + transcript;
        return newMessage.trim();
      });
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  useEffect(() => {
    // Show interim results in input
    if (interimTranscript && isListening) {
      setInputMessage(interimTranscript);
    }
  }, [interimTranscript, isListening]);

  const setupSocketListeners = () => {
    socket.on('conversation:joined', handleConversationJoined);
    socket.on('conversation:message-response', handleMessageResponse);
    socket.on('conversation:typing', handleTyping);
    socket.on('conversation:ended', handleConversationEnded);
    socket.on('conversation:error', handleError);
  };

  const cleanupSocketListeners = () => {
    socket.off('conversation:joined');
    socket.off('conversation:message-response');
    socket.off('conversation:typing');
    socket.off('conversation:ended');
    socket.off('conversation:error');
  };

  const startConversation = async () => {
    if (!user?.id) return;

    setIsStarting(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lessonId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      const sessionData = data.data.session;
      
      setSession(sessionData);
      
      // Initialize messages with AI's opening message
      if (sessionData.messages && sessionData.messages.length > 0) {
        const initialMessages = sessionData.messages.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender === 'ai' ? 'ai' : 'user',
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          corrections: msg.corrections || undefined,
        }));
        setMessages(initialMessages);
      }

      // Join socket room
      socket.joinConversation(sessionData.id, user.id);

    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation. Please try again.');
    } finally {
      setIsStarting(false);
      setIsLoading(false);
    }
  };

  const handleConversationJoined = (data: any) => {
    console.log('Joined conversation:', data);
  };

  const handleMessageResponse = (data: any) => {
    const { userMessage, aiResponse } = data;
    
    // Add user message if not already added
    setMessages(prev => {
      const userMsg = {
        id: userMessage.id,
        sender: 'user' as const,
        content: userMessage.content,
        timestamp: new Date(userMessage.timestamp),
        corrections: userMessage.corrections || undefined,
      };
      
      const aiMsg = {
        id: aiResponse.id,
        sender: 'ai' as const,
        content: aiResponse.content,
        timestamp: new Date(aiResponse.timestamp),
        suggestions: aiResponse.suggestions || undefined,
      };

      return [...prev, userMsg, aiMsg];
    });
    
    // Speak AI response if not muted and speech synthesis is supported
    if (!isMuted && isSpeechSynthesisSupported && aiResponse.content) {
      speak(aiResponse.content, { rate: 0.9, pitch: 1.1 });
    }
    
    setIsTyping(false);
  };

  const handleTyping = (data: { sender: string; isTyping: boolean }) => {
    if (data.sender === 'ai') {
      setIsTyping(data.isTyping);
    }
  };

  const handleConversationEnded = (data: any) => {
    setSession(prev => prev ? { ...prev, status: 'completed' } : null);
    onComplete(data.evaluation);
  };

  const handleError = (data: { message: string; error?: string }) => {
    setError(data.message);
    setIsTyping(false);
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !session || !user) return;

    const message = inputMessage.trim();
    setInputMessage('');
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Stop typing indicator
    socket.sendTyping(false);
    
    // Send message via socket
    socket.sendMessage(message);
    
    setIsTyping(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);
    
    // Send typing indicator
    if (value.trim() && session) {
      socket.sendTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socket.sendTyping(false);
      }, 1000);
    } else {
      socket.sendTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const endConversation = () => {
    if (session) {
      socket.endConversation();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
      setIsRecording(false);
    } else if (isSpeechSupported) {
      startListening();
      setIsRecording(true);
      setInputMessage(''); // Clear input when starting voice recording
    }
  };

  const speakMessage = (text: string) => {
    if (isSpeechSynthesisSupported) {
      speak(text, { rate: 0.9, pitch: 1.1 });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (isLoading || isStarting) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{isStarting ? 'Starting conversation...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={startConversation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-white rounded-xl shadow-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {session?.scenario.aiPersona.name}
            </h3>
            <p className="text-sm text-gray-600">
              {session?.scenario.aiPersona.role} • {session?.scenario.lesson.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCorrections(!showCorrections)}
            className={`p-2 rounded-lg ${showCorrections ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} hover:bg-opacity-80`}
            title="Toggle corrections"
          >
            <CheckCircle className="w-5 h-5" />
          </button>

          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg ${isMuted ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'} hover:bg-opacity-80`}
            title={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start space-x-2 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  
                  {/* Message bubble */}
                  <div className={`rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="flex items-start justify-between">
                      <p className="text-sm flex-1">{message.content}</p>
                      {message.sender === 'ai' && isSpeechSynthesisSupported && (
                        <button
                          onClick={() => speakMessage(message.content)}
                          className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="Play message"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>
                
                {/* Corrections */}
                {showCorrections && message.corrections && message.corrections.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 ml-10 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg"
                  >
                    <p className="text-sm font-medium text-yellow-800 mb-2">Corrections:</p>
                    {message.corrections.map((correction, idx) => (
                      <div key={idx} className="text-sm text-yellow-700 mb-1">
                        <span className="line-through">{correction.original}</span> → 
                        <span className="font-medium ml-1">{correction.corrected}</span>
                        <p className="text-xs text-yellow-600 mt-1">{correction.explanation}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 ml-10 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg"
                  >
                    <p className="text-sm font-medium text-blue-800 mb-2">Suggestions:</p>
                    {message.suggestions.map((suggestion, idx) => (
                      <p key={idx} className="text-sm text-blue-700 mb-1">• {suggestion}</p>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-green-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-2 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg"
        >
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={session?.status === 'completed'}
                maxLength={1000}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {inputMessage.length}/1000
              </div>
            </div>
          </div>
          
          <button
            onClick={toggleRecording}
            disabled={!isSpeechSupported || session?.status === 'completed'}
            className={`p-3 rounded-xl transition-colors ${
              isListening 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : isSpeechSupported
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
            title={
              !isSpeechSupported 
                ? 'Speech recognition not supported' 
                : isListening 
                ? 'Stop recording' 
                : 'Start voice input'
            }
          >
            {isListening ? (
              <div className="relative">
                <MicOff className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || session?.status === 'completed'}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {session && session.status === 'active' && (
          <div className="mt-3">
            {/* Voice status indicator */}
            {isListening && (
              <div className="flex items-center justify-center mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <Mic className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Listening...</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span>{session.messagesCount} messages</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{Math.floor(session.durationSeconds / 60)}:{(session.durationSeconds % 60).toString().padStart(2, '0')}</span>
                </div>
                {isSpeechSupported && (
                  <div className="flex items-center">
                    <Mic className="w-4 h-4 mr-1" />
                    <span>Voice enabled</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={endConversation}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                End Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}