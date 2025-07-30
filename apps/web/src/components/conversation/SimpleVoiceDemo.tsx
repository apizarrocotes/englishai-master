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

interface DemoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Add initial greeting message
  React.useEffect(() => {
    if (messages.length === 0) {
      const greeting: DemoMessage = {
        id: 'greeting',
        role: 'assistant',
        content: `Welcome to our restaurant! I'm your AI waiter. How can I help you today?`,
        timestamp: new Date()
      };
      setMessages([greeting]);
    }
  }, [messages.length]);

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      setError('Microphone access denied. Please allow microphone access and try again.');
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Process audio with speech-to-text
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert audio to base64
      const audioBase64 = await blobToBase64(audioBlob);
      
      const token = TokenStorage.getAccessToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://89.58.17.78:3001';
      const response = await fetch(`${apiUrl}/api/voice/speech-to-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioBase64: audioBase64,
          format: 'webm'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process audio');
      }

      const data = await response.json();
      const userText = data.data.text;

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
      await getAIResponse(userText);
      
    } catch (error) {
      setError('Failed to process your speech. Please try again.');
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get AI response
  const getAIResponse = async (userText: string) => {
    try {
      const token = TokenStorage.getAccessToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://89.58.17.78:3001';
      const response = await fetch(`${apiUrl}/api/voice/text-to-speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userText
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiText = data.data.text;

      // Add AI message
      const aiMessage: DemoMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      onResponseReceived?.(aiText);

    } catch (error) {
      setError('Failed to get AI response. Please try again.');
      console.error('Error getting AI response:', error);
    }
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
    await getAIResponse(userText);
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-blue-50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Voice Demo</h3>
              <p className="text-sm text-gray-600">{scenarioType}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {messages.length - 1} messages
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
            disabled={isProcessing}
            className={`p-3 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
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
              disabled={isProcessing}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={sendTextMessage}
            disabled={!textInput.trim() || isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-2 text-center">
          {isRecording ? 'Recording... Click the microphone to stop' : 'Click the microphone to start recording or type a message'}
        </div>
      </div>
    </div>
  );
}