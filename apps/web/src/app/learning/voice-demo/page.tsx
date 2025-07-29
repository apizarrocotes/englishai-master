'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Mic, 
  MessageCircle, 
  Volume2, 
  BookOpen,
  Target,
  Clock,
  CheckCircle,
  Info
} from 'lucide-react';
import { useUser, useIsAuthenticated, useAuthActions } from '@/stores/authStore';
import VoiceConversation from '@/components/conversation/VoiceConversation';

interface DemoLessonData {
  id: string;
  title: string;
  description: string;
  scenarioType: string;
  learningObjectives: string[];
  vocabulary: string[];
  estimatedDuration: number;
  instructions: string[];
}

export default function VoiceDemoPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { initialize } = useAuthActions();
  
  const [currentStep, setCurrentStep] = useState<'intro' | 'practice' | 'complete'>('intro');
  const [lessonStarted, setLessonStarted] = useState(false);
  const [conversationStats, setConversationStats] = useState({
    messagesExchanged: 0,
    timeSpent: 0,
    totalScore: 0
  });

  // Demo lesson data
  const demoLesson: DemoLessonData = {
    id: 'voice-demo-001',
    title: 'Restaurant Ordering Practice',
    description: 'Practice ordering food at a restaurant using voice conversation with AI',
    scenarioType: 'Restaurant Ordering',
    learningObjectives: [
      'Practice polite ordering phrases',
      'Learn restaurant vocabulary',
      'Improve pronunciation of food items',
      'Practice asking questions about menu items'
    ],
    vocabulary: [
      'menu', 'order', 'appetizer', 'main course', 'dessert',
      'bill', 'check', 'recommendation', 'allergies', 'vegetarian'
    ],
    estimatedDuration: 15,
    instructions: [
      'You will have a conversation with an AI waiter',
      'Try to order a complete meal (appetizer, main course, drink)',
      'Ask questions about the menu items',
      'Be polite and use proper restaurant etiquette',
      'The AI will guide you through the ordering process'
    ]
  };

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push('/auth');
    }
  }, [isAuthenticated, user, router]);

  const handleStartLesson = () => {
    setCurrentStep('practice');
    setLessonStarted(true);
  };

  const handleMessageSent = (message: string, audioBlob?: Blob) => {
    setConversationStats(prev => ({
      ...prev,
      messagesExchanged: prev.messagesExchanged + 1
    }));
  };

  const handleResponseReceived = (response: string, audioBlob?: Blob) => {
    // Update stats when AI responds
    setConversationStats(prev => ({
      ...prev,
      timeSpent: prev.timeSpent + 1 // Simplified time tracking
    }));
  };

  const handleConversationEnd = () => {
    setCurrentStep('complete');
    // Calculate final score based on interaction
    const score = Math.min(100, conversationStats.messagesExchanged * 10 + 50);
    setConversationStats(prev => ({
      ...prev,
      totalScore: score
    }));
  };

  const renderIntroStep = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => router.push('/learning')}
          className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voice Conversation Demo</h1>
          <p className="text-gray-600 mt-1">Practice real-time English conversation with AI</p>
        </div>
      </div>

      {/* Lesson Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{demoLesson.title}</h2>
              <p className="text-blue-100">{demoLesson.scenarioType}</p>
            </div>
          </div>
          <p className="text-blue-100">{demoLesson.description}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{demoLesson.estimatedDuration}</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{demoLesson.learningObjectives.length}</div>
              <div className="text-sm text-gray-600">Objectives</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{demoLesson.vocabulary.length}</div>
              <div className="text-sm text-gray-600">Vocabulary</div>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Learning Objectives
            </h3>
            <ul className="space-y-2">
              {demoLesson.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{objective}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Vocabulary Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
              Key Vocabulary
            </h3>
            <div className="flex flex-wrap gap-2">
              {demoLesson.vocabulary.map((word, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-600" />
              Instructions
            </h3>
            <ul className="space-y-2">
              {demoLesson.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{instruction}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Technical Requirements Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Volume2 className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">Audio Requirements</h4>
                <p className="text-sm text-yellow-700">
                  This lesson requires microphone access for voice input and speakers/headphones for audio output. 
                  Make sure your browser allows microphone access when prompted.
                </p>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartLesson}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <Mic className="w-5 h-5" />
            Start Voice Conversation
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderPracticeStep = () => (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => setCurrentStep('intro')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{demoLesson.title}</h1>
            <p className="text-gray-600">Practice Session</p>
          </div>
        </div>

        {/* Live Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-blue-600">
            <MessageCircle className="w-4 h-4" />
            <span>{conversationStats.messagesExchanged} messages</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <Clock className="w-4 h-4" />
            <span>{Math.floor(conversationStats.timeSpent / 60)}:{(conversationStats.timeSpent % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Voice Conversation Component */}
        <div className="lg:col-span-3">
          <VoiceConversation
            lessonId={demoLesson.id}
            scenarioType={demoLesson.scenarioType}
            onMessageSent={handleMessageSent}
            onResponseReceived={handleResponseReceived}
            onConversationEnd={handleConversationEnd}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Reference */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Reference</h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Useful Phrases</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>"I'd like to order..."</li>
                  <li>"What do you recommend?"</li>
                  <li>"I'm allergic to..."</li>
                  <li>"Can I get the check, please?"</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Key Vocabulary</h4>
                <div className="flex flex-wrap gap-1">
                  {demoLesson.vocabulary.slice(0, 6).map((word, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Messages Exchanged</span>
                <span className="font-medium">{conversationStats.messagesExchanged}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Time Practicing</span>
                <span className="font-medium">{Math.floor(conversationStats.timeSpent / 60)}:{(conversationStats.timeSpent % 60).toString().padStart(2, '0')}</span>
              </div>
              <button
                onClick={handleConversationEnd}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Complete Lesson
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Lesson Complete!</h1>
        <p className="text-gray-600 mb-8">
          Great job practicing your English conversation skills. Here's your session summary:
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{conversationStats.messagesExchanged}</div>
            <div className="text-sm text-gray-600">Messages</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{Math.floor(conversationStats.timeSpent / 60)}</div>
            <div className="text-sm text-gray-600">Minutes</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{conversationStats.totalScore}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setCurrentStep('intro');
              setConversationStats({ messagesExchanged: 0, timeSpent: 0, totalScore: 0 });
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/learning')}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            Back to Learning
          </button>
        </div>
      </motion.div>
    </div>
  );

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {currentStep === 'intro' && renderIntroStep()}
      {currentStep === 'practice' && renderPracticeStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </div>
  );
}