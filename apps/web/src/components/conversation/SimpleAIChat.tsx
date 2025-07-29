'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { TokenStorage } from '@/lib/auth';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface ConversationSession {
  id: string;
  status: 'active' | 'completed';
  messages: Message[];
  aiPersona: {
    name: string;
    role: string;
  };
}

interface SimpleAIChatProps {
  lessonId: string;
  onComplete?: (evaluation: any) => void;
}

export default function SimpleAIChat({ lessonId, onComplete }: SimpleAIChatProps) {
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize conversation
  useEffect(() => {
    console.log('🎬 SimpleAIChat: useEffect triggered with lessonId:', lessonId);
    if (lessonId) {
      startConversation();
    } else {
      console.warn('⚠️ SimpleAIChat: No lessonId provided');
    }
  }, [lessonId]);

  const startConversation = async () => {
    console.log('🚀 SimpleAIChat: Starting conversation for lessonId:', lessonId);
    setIsLoading(true);
    setError(null);

    try {
      const token = TokenStorage.getAccessToken();
      console.log('🔑 SimpleAIChat: Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      console.log('📡 SimpleAIChat: Making request to /api/conversations/start');
      const response = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lessonId }),
      });

      console.log('📡 SimpleAIChat: Response status:', response.status);
      console.log('📡 SimpleAIChat: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ SimpleAIChat: API error response:', errorData);
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const data = await response.json();
      console.log('✅ SimpleAIChat: Successfully received response:', data);
      const sessionData = data.data.session;
      
      setSession({
        id: sessionData.id,
        status: sessionData.status,
        messages: [],
        aiPersona: sessionData.scenario.aiPersona
      });

      // Add initial AI message if exists
      if (sessionData.messages && sessionData.messages.length > 0) {
        const initialMessages = sessionData.messages.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp,
        }));
        console.log('💬 SimpleAIChat: Setting initial messages:', initialMessages.length);
        setMessages(initialMessages);
      }

      console.log('✅ SimpleAIChat: Conversation initialization complete');

    } catch (error) {
      console.error('❌ SimpleAIChat: Error starting conversation:', error);
      console.error('❌ SimpleAIChat: Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        lessonId,
        hasToken: !!TokenStorage.getAccessToken()
      });
      setError(`Failed to start conversation: ${(error as Error).message}`);
    } finally {
      console.log('🏁 SimpleAIChat: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !session || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);
    setError(null);

    // Add user message to UI immediately
    const userMsgObj: Message = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsgObj]);

    try {
      const token = TokenStorage.getAccessToken();
      
      const response = await fetch(`/api/conversations/${session.id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      
      // Replace temp user message and add AI response
      setMessages(prev => {
        const withoutTemp = prev.filter(msg => msg.id !== userMsgObj.id);
        const userMsg: Message = {
          id: data.data.userMessage.id,
          sender: 'user',
          content: data.data.userMessage.content,
          timestamp: data.data.userMessage.timestamp,
        };
        const aiMsg: Message = {
          id: data.data.aiResponse.id,
          sender: 'ai',
          content: data.data.aiResponse.content,
          timestamp: data.data.aiResponse.timestamp,
        };
        return [...withoutTemp, userMsg, aiMsg];
      });

      // Check if we should end conversation (after 6+ exchanges)
      const totalMessages = data.data.session.messagesCount;
      if (totalMessages >= 8) {
        setTimeout(() => endConversation(), 2000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${(error as Error).message}`);
      
      // Remove the temporary user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMsgObj.id));
    } finally {
      setIsSending(false);
    }
  };

  const endConversation = async () => {
    if (!session) return;

    try {
      const token = TokenStorage.getAccessToken();
      
      const response = await fetch(`/api/conversations/${session.id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to end conversation');
      }

      const data = await response.json();
      
      // Call the completion callback with evaluation
      if (onComplete && data.data.evaluation) {
        onComplete(data.data.evaluation);
      }

    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-xl border">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Starting conversation...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-xl border">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-red-600" />
          </div>
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
    <div className="bg-white rounded-xl border shadow-sm h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-blue-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {session?.aiPersona.name || 'AI Teacher'}
            </h3>
            <p className="text-sm text-gray-600">
              {session?.aiPersona.role || 'English Conversation Partner'}
            </p>
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
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] flex items-start space-x-2 ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
            }`}>
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
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        
        {isSending && (
          <div className="flex justify-start">
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
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              disabled={isSending || session?.status === 'completed'}
              maxLength={1000}
            />
            <div className="text-xs text-gray-400 mt-1 flex justify-between items-center">
              <span>{inputMessage.length}/1000</span>
              {messages.length >= 6 && (
                <button
                  onClick={endConversation}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  End Conversation
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isSending || session?.status === 'completed'}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}