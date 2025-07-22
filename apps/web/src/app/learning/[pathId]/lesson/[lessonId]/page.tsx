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
  PauseCircle
} from 'lucide-react';
import { useUser, useIsAuthenticated, useAuthActions } from '@/stores/authStore';

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
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/learning/lessons/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lesson');
      }

      const data = await response.json();
      setLesson(data.data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setError('Failed to load lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (status: string, score?: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
      
      const response = await fetch('/api/learning/progress', {
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

  const completeLesson = async () => {
    setIsCompleting(true);
    try {
      // Simulate lesson completion with a score
      const simulatedScore = Math.floor(Math.random() * 30) + 70; // 70-100 score
      await updateProgress('completed', simulatedScore);
      
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

        {/* Lesson Content Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lesson Content</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <PlayCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Lesson Content</h3>
            <p className="text-gray-600 mb-4">
              This is where the interactive lesson content would be displayed. 
              This could include videos, exercises, quizzes, and conversational practice.
            </p>
            <p className="text-sm text-gray-500">
              In a full implementation, this would contain rich interactive content 
              tailored to the lesson objectives and user's learning level.
            </p>
          </div>
        </motion.div>

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
          
          {lesson.userProgress?.status !== 'completed' && (
            <button
              onClick={completeLesson}
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
                  Complete Lesson
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