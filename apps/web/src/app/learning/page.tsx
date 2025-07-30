'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Target, Users, Star, Mic } from 'lucide-react';
import { useUser, useIsAuthenticated, useAuthActions } from '@/stores/authStore';
import { TokenStorage } from '@/lib/auth';

interface LearningPath {
  id: string;
  name: string;
  description: string;
  levelRange: string;
  category: string;
  totalLessons: number;
  estimatedHours: number;
  isActive: boolean;
  lessons: {
    id: string;
    title: string;
    orderIndex: number;
    difficultyLevel: number;
    estimatedDuration: number;
    userProgress?: {
      status: string;
      score: number | null;
      timeSpent: number;
      completedAt: string | null;
    } | null;
  }[];
}

export default function LearningPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { initialize } = useAuthActions();
  
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push('/auth');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  const fetchLearningPaths = async () => {
    try {
      setLoading(true);
      const token = TokenStorage.getAccessToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('http://89.58.17.78:3001/api/learning/paths-direct', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch learning paths');
      }

      const data = await response.json();
      
      // Debug logging
      console.log('🔍 Learning paths received:', data.data);
      if (data.data.length > 0) {
        console.log('🔍 First path lessons:', data.data[0].lessons);
        if (data.data[0].lessons.length > 0) {
          console.log('🔍 First lesson progress:', data.data[0].lessons[0].userProgress);
        }
      }
      
      setLearningPaths(data.data);
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      setError('Failed to load learning paths. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPaths = selectedCategory === 'all' 
    ? learningPaths 
    : learningPaths.filter(path => path.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(learningPaths.map(path => path.category)))];

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

  const calculatePathProgress = (path: LearningPath) => {
    const completedLessons = path.lessons.filter(lesson => 
      lesson.userProgress?.status === 'completed'
    ).length;
    
    const totalLessons = path.lessons.length; // Use actual lessons, not the totalLessons field
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    // Debug logging
    console.log(`📊 Progress for ${path.name}:`, {
      completed: completedLessons,
      total: totalLessons,
      percentage: progressPercentage,
      lessons: path.lessons.map(l => ({ title: l.title, status: l.userProgress?.status || 'not_started' }))
    });
    
    return {
      completed: completedLessons,
      total: totalLessons,
      percentage: progressPercentage
    };
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Learning Paths</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded mb-3"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Learning Paths</h1>
              <p className="text-gray-600 mt-1">Choose your learning journey and start improving your English</p>
            </div>
          </div>
        </motion.div>

        {/* Voice Demo Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Mic className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Try Voice Conversation!</h3>
                    <p className="text-blue-100">Practice speaking English with AI in real-time</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/learning/voice-demo')}
                  className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Start Demo
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchLearningPaths}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Learning Paths Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPaths.map((path, index) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
              onClick={() => router.push(`/learning/${path.id}`)}
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(path.category)}`}>
                    {path.category}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(path.levelRange)}`}>
                    {path.levelRange}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {path.name}
                </h3>
                
                {path.description && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {path.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span>{path.totalLessons} lessons</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{path.estimatedHours}h</span>
                  </div>
                </div>

                {/* Progress Preview */}
                <div className="mb-4">
                  {(() => {
                    const progress = calculatePathProgress(path);
                    return (
                      <>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all" 
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {progress.completed} of {progress.total} lessons completed
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Action Button */}
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors group-hover:bg-blue-700">
                  Start Learning
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredPaths.length === 0 && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No learning paths found</h3>
            <p className="text-gray-600 mb-4">
              {selectedCategory === 'all' 
                ? 'No learning paths are available at the moment.' 
                : `No learning paths found in the "${selectedCategory}" category.`
              }
            </p>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View all paths
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}