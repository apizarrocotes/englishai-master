'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Target, 
  CheckCircle, 
  Circle, 
  Play, 
  Lock,
  TrendingUp,
  Users
} from 'lucide-react';
import { useUser, useIsAuthenticated, useAuthActions } from '@/stores/authStore';
import { TokenStorage } from '@/lib/auth';

interface Lesson {
  id: string;
  orderIndex: number;
  title: string;
  description: string;
  scenarioType: string;
  learningObjectives: string[];
  vocabulary: any;
  grammarFocus: string[];
  difficultyLevel: number;
  estimatedDuration: number;
  userProgress: {
    status: string;
    score: number | null;
    timeSpent: number;
    completedAt: string | null;
  } | null;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  levelRange: string;
  category: string;
  totalLessons: number;
  estimatedHours: number;
  lessons: Lesson[];
}

export default function LearningPathPage() {
  const router = useRouter();
  const params = useParams();
  const pathId = params.pathId as string;
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { initialize } = useAuthActions();
  
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push('/auth');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (pathId) {
      fetchLearningPath();
    }
  }, [pathId]);

  const fetchLearningPath = async () => {
    try {
      setLoading(true);
      const token = TokenStorage.getAccessToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log('🔍 Fetching learning path:', pathId, 'with token:', token ? 'present' : 'missing');
      
      // Try direct endpoint first (no auth) for faster response
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://89.58.17.78:3001';
      
      let response;
      try {
        console.log('🔄 Trying direct endpoint first...');
        response = await fetch(`${apiUrl}/api/learning/paths-direct/${pathId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
      } catch (error) {
        console.log('⚠️ Direct endpoint failed, trying auth endpoint...', error);
        // Fallback to auth endpoint
        response = await fetch(`${apiUrl}/api/learning/paths/${pathId}`, {
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
      console.log('✅ Learning path data received:', data.data);
      setLearningPath(data.data);
    } catch (error) {
      console.error('Error fetching learning path:', error);
      setError(`Failed to load learning path. ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (lesson: Lesson) => {
    const status = lesson.userProgress?.status;
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (status === 'in_progress') {
      return <Play className="w-5 h-5 text-blue-600" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const isLessonLocked = (lesson: Lesson, index: number) => {
    if (index === 0) return false; // First lesson is always unlocked
    
    // Check if previous lesson is completed
    const previousLesson = learningPath?.lessons[index - 1];
    return previousLesson?.userProgress?.status !== 'completed';
  };

  const getProgressPercentage = () => {
    if (!learningPath?.lessons.length) return 0;
    
    const completedLessons = learningPath.lessons.filter(
      lesson => lesson.userProgress?.status === 'completed'
    ).length;
    
    return (completedLessons / learningPath.lessons.length) * 100;
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'text-green-600 bg-green-50';
    if (level <= 3) return 'text-yellow-600 bg-yellow-50';
    if (level <= 4) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getLevelColor = (levelRange: string) => {
    if (levelRange.includes('beginner') || levelRange.includes('A1')) return 'text-green-600 bg-green-50';
    if (levelRange.includes('intermediate') || levelRange.includes('B1') || levelRange.includes('B2')) return 'text-yellow-600 bg-yellow-50';
    if (levelRange.includes('advanced') || levelRange.includes('C1') || levelRange.includes('C2')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'business': 'text-blue-600 bg-blue-50',
      'conversation': 'text-green-600 bg-green-50',
      'grammar': 'text-purple-600 bg-purple-50',
      'vocabulary': 'text-orange-600 bg-orange-50',
      'pronunciation': 'text-pink-600 bg-pink-50',
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50';
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
            <div className="h-32 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !learningPath) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Learning path not found</h3>
            <p className="text-gray-600 mb-4">{error || 'The requested learning path could not be found.'}</p>
            <button
              onClick={() => router.push('/learning')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Learning Paths
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
              onClick={() => router.push('/learning')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{learningPath.name}</h1>
              <p className="text-gray-600 mt-1">Track your progress and complete lessons</p>
            </div>
          </div>

          {/* Path Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(learningPath.category)}`}>
                {learningPath.category}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(learningPath.levelRange)}`}>
                {learningPath.levelRange}
              </div>
            </div>

            {learningPath.description && (
              <p className="text-gray-600 mb-6">{learningPath.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{learningPath.totalLessons}</div>
                <div className="text-sm text-gray-600">Total Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{learningPath.estimatedHours}h</div>
                <div className="text-sm text-gray-600">Estimated Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {learningPath.lessons.filter(l => l.userProgress?.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(getProgressPercentage())}%
                </div>
                <div className="text-sm text-gray-600">Progress</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(getProgressPercentage())}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lessons List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {learningPath.lessons.map((lesson, index) => {
            const isLocked = isLessonLocked(lesson, index);
            const isCompleted = lesson.userProgress?.status === 'completed';
            const isInProgress = lesson.userProgress?.status === 'in_progress';

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all ${
                  isLocked 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:shadow-md cursor-pointer'
                }`}
                onClick={() => {
                  if (!isLocked) {
                    router.push(`/learning/${pathId}/lesson/${lesson.id}`);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-gray-400" />
                      ) : (
                        getStatusIcon(lesson)
                      )}
                    </div>

                    {/* Lesson Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${
                          isLocked ? 'text-gray-400' : 'text-gray-900'
                        }`}>
                          {lesson.orderIndex}. {lesson.title}
                        </h3>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(lesson.difficultyLevel)}`}>
                          Level {lesson.difficultyLevel}
                        </div>
                      </div>

                      {lesson.description && (
                        <p className={`mb-3 ${
                          isLocked ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {lesson.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{lesson.estimatedDuration} min</span>
                        </div>
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          <span>{lesson.scenarioType}</span>
                        </div>
                      </div>

                      {/* Learning Objectives */}
                      {lesson.learningObjectives.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Learning objectives:</p>
                          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                            {lesson.learningObjectives.slice(0, 2).map((objective, idx) => (
                              <li key={idx}>{objective}</li>
                            ))}
                            {lesson.learningObjectives.length > 2 && (
                              <li className="text-gray-500">+{lesson.learningObjectives.length - 2} more...</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Progress Info */}
                      {lesson.userProgress && !isLocked && (
                        <div className="flex items-center gap-4 text-sm">
                          {isCompleted && (
                            <>
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span>Completed</span>
                              </div>
                              {lesson.userProgress.score && (
                                <div className="flex items-center text-blue-600">
                                  <TrendingUp className="w-4 h-4 mr-1" />
                                  <span>Score: {lesson.userProgress.score}%</span>
                                </div>
                              )}
                              <div className="text-gray-500">
                                {Math.round(lesson.userProgress.timeSpent / 60)} min spent
                              </div>
                            </>
                          )}
                          {isInProgress && (
                            <div className="flex items-center text-blue-600">
                              <Play className="w-4 h-4 mr-1" />
                              <span>In Progress</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0 ml-4">
                    {!isLocked && (
                      <button className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isCompleted
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : isInProgress
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}>
                        {isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}