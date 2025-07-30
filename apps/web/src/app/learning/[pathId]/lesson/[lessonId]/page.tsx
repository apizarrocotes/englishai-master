'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Target, 
  Volume2,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  MessageCircle
} from 'lucide-react';
import { useUser, useIsAuthenticated, useAuthActions } from '@/stores/authStore';
import UnifiedLessonConversation from '@/components/conversation/UnifiedLessonConversation';
import { TokenStorage } from '@/lib/auth';

interface Lesson {
  id: string;
  pathId: string;
  orderIndex: number;
  title: string;
  description: string;
  scenarioType: string;
  learningObjectives: string[];
  vocabulary: any;
  grammarFocus: string[];
  difficultyLevel: number;
  estimatedDuration: number;
  path: {
    id: string;
    name: string;
  };
  userProgress: {
    status: string;
    score: number | null;
    timeSpent: number;
    completedAt: string | null;
  } | null;
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const pathId = params.pathId as string;
  const lessonId = params.lessonId as string;
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { initialize } = useAuthActions();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [conversationScore, setConversationScore] = useState<number | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push('/auth');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  useEffect(() => {
    // Start timer when component mounts
    setStartTime(new Date());
    
    // Update progress to in_progress if not already completed
    if (lesson && lesson.userProgress?.status !== 'completed') {
      updateProgress('in_progress');
    }
  }, [lesson]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const token = TokenStorage.getAccessToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log('🔍 Fetching lesson:', lessonId, 'with token:', token ? 'present' : 'missing');
      
      // Try direct endpoint first (no auth) for faster response
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://89.58.17.78:3001';
      
      let response;
      try {
        console.log('🔄 Trying direct lesson endpoint first...');
        response = await fetch(`${apiUrl}/api/learning/lessons-direct/${lessonId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
      } catch (error) {
        console.log('⚠️ Direct lesson endpoint failed, trying auth endpoint...', error);
        // Fallback to auth endpoint
        response = await fetch(`${apiUrl}/api/learning/lessons/${lessonId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Lesson data received:', data.data);
      setLesson(data.data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setError(`Failed to load lesson. ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (status: string, score?: number) => {
    try {
      const token = TokenStorage.getAccessToken();
      const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://89.58.17.78:3001';
      const response = await fetch(`${apiUrl}/api/learning/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          status,
          score,
          timeSpent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const data = await response.json();
      
      // Update local state
      if (lesson) {
        setLesson({
          ...lesson,
          userProgress: data.data
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleConversationComplete = (evaluation: any) => {
    setConversationComplete(true);
    setConversationScore(evaluation.overallScore);
    setShowConversation(false);
    
    // Auto-complete lesson if conversation score is good
    if (evaluation.overallScore >= 70) {
      // Refresh lesson data to get updated progress from backend
      setTimeout(() => {
        fetchLesson();
        completeLesson(evaluation.overallScore);
      }, 1000);
    }
  };

  const completeLesson = async (score?: number) => {
    setIsCompleting(true);
    try {
      // Use conversation score or simulate lesson completion
      const finalScore = score || conversationScore || Math.floor(Math.random() * 30) + 70;
      await updateProgress('completed', finalScore);
      
      // Show success and redirect after a delay
      setTimeout(() => {
        router.push(`/learning/${pathId}`);
      }, 2000);
    } catch (error) {
      console.error('Error completing lesson:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'text-green-600 bg-green-50';
    if (level <= 3) return 'text-yellow-600 bg-yellow-50';
    if (level <= 4) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Lesson not found</h3>
            <p className="text-gray-600 mb-4">{error || 'The requested lesson could not be found.'}</p>
            <button
              onClick={() => router.push(`/learning/${pathId}`)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Learning Path
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push(`/learning/${pathId}`)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {lesson.path.name} • Lesson {lesson.orderIndex}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
            </div>
          </div>
        </motion.div>

        {/* Lesson Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex flex-wrap gap-3 mb-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(lesson.difficultyLevel)}`}>
              Level {lesson.difficultyLevel}
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-medium text-blue-600 bg-blue-50">
              {lesson.scenarioType}
            </div>
          </div>

          {lesson.description && (
            <p className="text-gray-600 mb-6">{lesson.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center text-gray-600">
              <Clock className="w-5 h-5 mr-2" />
              <span>{lesson.estimatedDuration} minutes</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Target className="w-5 h-5 mr-2" />
              <span>{lesson.learningObjectives.length} objectives</span>
            </div>
            <div className="flex items-center text-gray-600">
              <BookOpen className="w-5 h-5 mr-2" />
              <span>{lesson.grammarFocus.length} grammar topics</span>
            </div>
          </div>
        </motion.div>

        {/* Learning Objectives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Learning Objectives</h2>
          <ul className="space-y-3">
            {lesson.learningObjectives.map((objective, index) => (
              <li key={index} className="flex items-start">
                <Target className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{objective}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Vocabulary Section */}
        {lesson.vocabulary && typeof lesson.vocabulary === 'object' && Object.keys(lesson.vocabulary).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Vocabulary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(lesson.vocabulary).map(([word, definition], index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{word}</h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm">{String(definition)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Grammar Focus */}
        {lesson.grammarFocus.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Grammar Focus</h2>
            <div className="flex flex-wrap gap-2">
              {lesson.grammarFocus.map((topic, index) => (
                <div key={index} className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                  {topic}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Lesson Content - AI Conversation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Practice with AI Teacher</h2>
            {!showConversation && (
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Chat & Voice
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Interactive
                </div>
              </div>
            )}
          </div>
          
          {!showConversation ? (
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start Interactive Lesson Practice</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Practice "{lesson.title}" with our AI teacher using both text chat and voice conversation. 
                Get real-time feedback, corrections, and personalized guidance adapted to this lesson's content.
              </p>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm mx-auto">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <MessageCircle className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">Text Chat</div>
                  <div className="text-xs text-gray-600">Type & practice</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <Volume2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-900">Voice Mode</div>
                  <div className="text-xs text-gray-600">Speak naturally</div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{lesson.estimatedDuration}</div>
                  <div className="text-sm text-gray-600">minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{lesson.learningObjectives.length}</div>
                  <div className="text-sm text-gray-600">objectives</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{Object.keys(lesson.vocabulary || {}).length}</div>
                  <div className="text-sm text-gray-600">vocabulary</div>
                </div>
              </div>
              <button
                onClick={() => setShowConversation(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-colors flex items-center mx-auto"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Interactive Practice
              </button>
            </div>
          ) : (
            <div>
              <UnifiedLessonConversation
                lessonId={lessonId}
                lessonData={{
                  id: lesson.id,
                  title: lesson.title,
                  description: lesson.description,
                  scenarioType: lesson.scenarioType,
                  learningObjectives: lesson.learningObjectives,
                  vocabulary: lesson.vocabulary || {},
                  grammarFocus: lesson.grammarFocus,
                  difficultyLevel: lesson.difficultyLevel,
                  estimatedDuration: lesson.estimatedDuration
                }}
                onComplete={handleConversationComplete}
                onClose={() => setShowConversation(false)}
              />
            </div>
          )}
        </motion.div>

        {/* Conversation Results */}
        {conversationComplete && conversationScore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8"
          >
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">Great Conversation Practice!</h3>
              <p className="text-green-700 mb-4">
                You completed the AI conversation with a score of <span className="font-bold">{conversationScore}%</span>
              </p>
              <div className="w-full bg-green-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${conversationScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-green-600">
                {conversationScore >= 90 ? 'Excellent work!' : 
                 conversationScore >= 80 ? 'Well done!' :
                 conversationScore >= 70 ? 'Good job!' : 'Keep practicing!'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex gap-4 justify-center"
        >
          <button
            onClick={() => router.push(`/learning/${pathId}`)}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Back to Path
          </button>
          
          {!conversationComplete && !showConversation && lesson.userProgress?.status !== 'completed' && (
            <button
              onClick={() => setShowConversation(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-colors flex items-center"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Interactive Practice
            </button>
          )}

          {(conversationComplete || lesson.userProgress?.status !== 'completed') && !showConversation && (
            <button
              onClick={() => completeLesson()}
              disabled={isCompleting}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isCompleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {conversationComplete ? 'Complete Lesson' : 'Skip to Complete'}
                </>
              )}
            </button>
          )}

          {lesson.userProgress?.status === 'completed' && (
            <div className="px-8 py-3 bg-green-100 text-green-800 rounded-lg font-medium flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Lesson Completed
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}