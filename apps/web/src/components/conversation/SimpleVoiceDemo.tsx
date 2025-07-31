'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Play,
  MessageCircle,
  Loader2,
  AlertCircle,
  Bot,
  User
} from 'lucide-react';
import { TokenStorage } from '@/lib/auth';

interface SimpleVoiceDemoProps {
  lessonId: string;
  scenarioType: string;
  onMessageSent?: (message: string) => void;
  onResponseReceived?: (response: string) => void;
  onConversationEnd?: () => void;
}

interface ConversationSession {
  id: string;
  status: 'active' | 'completed';
  aiPersona: {
    name: string;
    role: string;
  };
}

interface DemoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Extend window for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function SimpleVoiceDemo({
  lessonId,
  scenarioType,
  onMessageSent,
  onResponseReceived,
  onConversationEnd
}: SimpleVoiceDemoProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize conversation session and speech recognition
  React.useEffect(() => {
    console.log('useEffect triggered with lessonId:', lessonId);
    if (lessonId) {
      console.log('Starting initialization...');
      startConversationSession();
      initializeSpeechRecognition();
    } else {
      console.warn('No lessonId provided, skipping initialization');
    }
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [lessonId]);

  // Initialize Web Speech API
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
        console.log('Speech recognition started');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        console.log('Speech recognized:', transcript, 'Confidence:', confidence);
        console.log('About to add user message and call sendMessageToAI');
        
        // Add user message
        const userMessage: DemoMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: transcript,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        onMessageSent?.(transcript);
        
        // Get AI response immediately - no delay needed with new logic
        console.log('Calling sendMessageToAI with transcript:', transcript);
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
        console.log('Speech recognition ended');
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Speech recognition not supported in this browser');
      setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  };

  // Start conversation session (mock version while database is down)
  const startConversationSession = async () => {
    console.log('Starting conversation session...');
    setIsInitializing(true);
    setError(null);

    try {
      console.log('About to create mock session...');
      
      // Create a mock session immediately
      const mockSession = {
        id: `mock-session-${Date.now()}`,
        status: 'active' as const,
        aiPersona: {
          name: 'AI Waiter',
          role: 'Restaurant Server'
        }
      };
      
      console.log('Mock session created:', mockSession);
      console.log('Setting session state...');
      setSession(mockSession);
      console.log('Session state set');

      // Add initial greeting message
      const greeting: DemoMessage = {
        id: 'greeting',
        role: 'assistant',
        content: 'Welcome to our restaurant! I\'m your AI waiter. How can I help you today?',
        timestamp: new Date()
      };
      
      console.log('Setting initial messages...');
      setMessages([greeting]);
      console.log('Messages set');
      
      console.log('Session initialization complete - setting isInitializing to false');
      setIsInitializing(false);
      
      // Generate speech for the greeting after a short delay
      setTimeout(() => {
        console.log('About to generate speech for greeting');
        generateSpeechForMessage(greeting.content);
      }, 500);

    } catch (error) {
      console.error('Error in startConversationSession:', error);
      setError('Failed to start conversation. Please try again.');
      setSession(null);
      setIsInitializing(false);
    }
  };


  // Generate high-quality speech using OpenAI TTS directly
  const generateSpeechForMessage = async (text: string) => {
    if (isGeneratingSpeech || isPlayingAudio) {
      console.log('Speech generation already in progress, skipping...');
      return;
    }
    
    setIsGeneratingSpeech(true);
    
    try {
      // Use backend TTS endpoint instead of direct OpenAI call for security
      const token = TokenStorage.getAccessToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://89.58.17.78:3001';
      
      const ttsResponse = await fetch(`${apiUrl}/api/voice/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: 'nova', // This is handled by backend .env config
          speed: 0.95
        }),
      });

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        // Convert base64 audio to blob
        const audioBlob = new Blob([Uint8Array.from(atob(ttsData.data.audio), c => c.charCodeAt(0))], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setIsPlayingAudio(true);
        const audio = new Audio(audioUrl);
        
        audio.onplay = () => setIsPlayingAudio(true);
        audio.onended = () => {
          setIsPlayingAudio(false);
          setIsGeneratingSpeech(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          setIsGeneratingSpeech(false);
          URL.revokeObjectURL(audioUrl);
          console.error('Error playing OpenAI audio');
        };
        
        await audio.play();
        return;
      }
    } catch (error) {
      console.warn('OpenAI TTS failed, falling back to browser Speech Synthesis:', error);
    }

    // Enhanced fallback to browser's Speech Synthesis API
    try {
      if ('speechSynthesis' in window) {
        setIsPlayingAudio(true);
        
        // Wait for voices to load
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
        utterance.rate = 0.85; // Slightly slower for better clarity
        utterance.pitch = 1.1; // Slightly higher pitch for friendliness
        utterance.volume = 1.0;
        
        // Try to find the best available voice
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Samantha') || // macOS high-quality voice
          voice.name.includes('Google US English') ||
          voice.name.includes('Microsoft Zira') ||
          voice.name.includes('Google UK English Female') ||
          (voice.lang.startsWith('en') && voice.name.includes('Female'))
        ) || voices.find(voice => voice.lang.startsWith('en-US')) || voices[0];
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log('Using voice:', preferredVoice.name);
        }
        
        utterance.onstart = () => setIsPlayingAudio(true);
        utterance.onend = () => {
          setIsPlayingAudio(false);
          setIsGeneratingSpeech(false);
        };
        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          setIsPlayingAudio(false);
          setIsGeneratingSpeech(false);
        };
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn('Browser speech synthesis also failed:', error);
      setIsPlayingAudio(false);
      setIsGeneratingSpeech(false);
    } finally {
      if (!isPlayingAudio) {
        setIsGeneratingSpeech(false);
      }
    }
  };

  // Start speech recognition
  const startRecording = async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available. Please use a supported browser.');
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

  // Stop speech recognition
  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };


  // Send message to AI and get response (mock version with OpenAI direct call)
  const sendMessageToAI = async (userText: string) => {
    console.log('sendMessageToAI called with:', userText);
    console.log('Current session:', session);
    console.log('isInitializing:', isInitializing);
    
    // If no session exists, create one immediately
    if (!session) {
      console.log('No session found, creating emergency session...');
      const emergencySession = {
        id: `emergency-session-${Date.now()}`,
        status: 'active' as const,
        aiPersona: {
          name: 'AI Waiter',
          role: 'Restaurant Server'
        }
      };
      setSession(emergencySession);
      console.log('Emergency session created:', emergencySession);
    }
    
    // Use current session or emergency session
    const currentSession = session || {
      id: `fallback-session-${Date.now()}`,
      status: 'active' as const,
      aiPersona: { name: 'AI Waiter', role: 'Restaurant Server' }
    };
    
    console.log('Using session:', currentSession.id);

    try {
      setIsProcessing(true);
      
      // Generate AI response using a mock restaurant waiter
      const aiText = await generateMockAIResponse(userText);

      // Add AI message
      const aiMessage: DemoMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      onResponseReceived?.(aiText);

      // Generate speech for AI response
      generateSpeechForMessage(aiText);

    } catch (error) {
      setError('Failed to get AI response. Please try again.');
      console.error('Error getting AI response:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate mock AI response for restaurant scenario
  const generateMockAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple pattern matching for restaurant responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! Welcome to our restaurant. What can I get started for you today?";
    }
    
    if (lowerMessage.includes('menu') || lowerMessage.includes('what do you have')) {
      return "We have a variety of delicious options! We serve appetizers like calamari and bruschetta, main courses including pasta, steaks, and fish, plus amazing desserts. What type of food are you in the mood for?";
    }
    
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      return "I'd highly recommend our signature dish - the grilled salmon with lemon butter sauce. It's very popular! Or if you prefer meat, our ribeye steak is excellent. Do either of those sound good?";
    }
    
    if (lowerMessage.includes('order') || lowerMessage.includes('like') || lowerMessage.includes('want')) {
      return "Great choice! I'll get that started for you. Would you like any appetizers or drinks to go with that? And how would you like that prepared?";
    }
    
    if (lowerMessage.includes('drink') || lowerMessage.includes('beverage')) {
      return "For drinks, we have soft drinks, juices, coffee, tea, and a selection of wines and cocktails. What would you prefer?";
    }
    
    if (lowerMessage.includes('check') || lowerMessage.includes('bill') || lowerMessage.includes('pay')) {
      return "Of course! I'll bring your check right over. Thank you for dining with us today. How was everything?";
    }
    
    if (lowerMessage.includes('thank')) {
      return "You're very welcome! It was my pleasure serving you today. Please come back and visit us again soon!";
    }
    
    // Default response
    return "I understand. Let me help you with that. Is there anything else I can assist you with today?";
  };

  // Send text message
  const sendTextMessage = async () => {
    if (!textInput.trim()) return;
    
    const userText = textInput.trim();
    setTextInput('');
    
    // Add user message
    const userMessage: DemoMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    onMessageSent?.(userText);

    // Get AI response
    await sendMessageToAI(userText);
  };

  // Play audio response from AI
  const playAudioResponse = (audioBase64: string) => {
    try {
      const audioBlob = new Blob([Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onplay = () => setIsPlayingAudio(true);
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => setIsPlayingAudio(false);
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          setIsPlayingAudio(false);
        });
      } else {
        // Create new audio element if ref doesn't exist
        const audio = new Audio(audioUrl);
        audio.onplay = () => setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          setIsPlayingAudio(false);
        });
      }
    } catch (error) {
      console.error('Error processing audio response:', error);
      setIsPlayingAudio(false);
    }
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data:audio/webm;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Starting conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
      {/* Hidden audio element for playing AI responses */}
      <audio ref={audioRef} />
      
      {/* Header */}
      <div className="border-b p-4 bg-blue-50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {session?.aiPersona?.name || 'Voice Demo'}
              </h3>
              <p className="text-sm text-gray-600">
                {session?.aiPersona?.role || scenarioType}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isPlayingAudio && (
              <div className="flex items-center space-x-2 text-green-600">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">AI Speaking...</span>
              </div>
            )}
            <div className="text-sm text-gray-500">
              {messages.length - 1} messages
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] flex items-start space-x-2 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
            }`}>
              {/* Avatar */}
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
              
              {/* Message bubble */}
              <div className={`rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-green-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">Processing...</span>
                </div>
              </div>
            </div>
          </div>
        )}
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
          {/* Voice Recording Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || !session}
            className={`p-3 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50`}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Input */}
          <div className="flex-1">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
              placeholder="Or type your message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing || !session}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={sendTextMessage}
            disabled={!textInput.trim() || isProcessing || !session}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-2 text-center">
          {isRecording ? 'Listening... Speak now or click microphone to stop' : 'Click the microphone to start voice recognition or type a message'}
          <br />
          <span className="text-green-600">🎙️ Real Speech Recognition + ✨ OpenAI TTS-HD</span>
          {isListening && (
            <div className="text-blue-600 animate-pulse mt-1">● Listening for speech...</div>
          )}
        </div>
      </div>
    </div>
  );
}