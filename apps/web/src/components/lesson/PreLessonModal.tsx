'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Volume2, 
  Settings, 
  PlayCircle,
  Crown,
  User,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';
import { useActiveTeacher, getPersonalityIcon, getFocusIcon, getAccentFlag } from '@/hooks/useActiveTeacher';
import TeacherProfileSettings from '@/components/settings/TeacherProfileSettings';

interface PreLessonModalProps {
  lessonTitle: string;
  lessonType: string;
  onStartLesson: () => void;
  onClose: () => void;
}

export default function PreLessonModal({ 
  lessonTitle, 
  lessonType, 
  onStartLesson, 
  onClose 
}: PreLessonModalProps) {
  const { activeTeacher, loading } = useActiveTeacher();
  const [showTeacherSettings, setShowTeacherSettings] = useState(false);

  const handleStartWithTeacher = () => {
    onStartLesson();
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Ready to Practice?</h2>
                  <p className="text-blue-100">
                    {lessonTitle} • {lessonType}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading your AI teacher...</p>
              </div>
            ) : activeTeacher ? (
              <div className="p-6">
                {/* Teacher Introduction */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-white rounded-full overflow-hidden shadow-lg">
                          <img 
                            src={activeTeacher.personality.avatarUrl} 
                            alt={activeTeacher.personality.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/avatars/default-teacher.jpg';
                            }}
                          />
                        </div>
                        {activeTeacher.isSystemProfile && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Crown className="w-3 h-3 text-yellow-800" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {activeTeacher.name}
                          </h3>
                          {activeTeacher.isSystemProfile && (
                            <div className="flex items-center bg-yellow-100 text-yellow-800 rounded-full px-2 py-1">
                              <Sparkles className="w-3 h-3 mr-1" />
                              <span className="text-xs font-medium">Premium</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          {activeTeacher.personality.title} • {activeTeacher.personality.background.split('.')[0]}
                        </p>
                        <p className="text-blue-700 text-sm italic">
                          "{activeTeacher.personality.catchPhrases[0]}"
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowTeacherSettings(true)}
                      className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Switch
                    </button>
                  </div>

                  {/* Teacher Features */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl mb-1">
                        {getPersonalityIcon(activeTeacher.teachingStyle.personality)}
                      </div>
                      <div className="text-xs font-medium text-gray-900 capitalize">
                        {activeTeacher.teachingStyle.personality}
                      </div>
                      <div className="text-xs text-gray-600">Personality</div>
                    </div>

                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl mb-1">
                        {getFocusIcon(activeTeacher.teachingFocus.primaryFocus)}
                      </div>
                      <div className="text-xs font-medium text-gray-900 capitalize">
                        {activeTeacher.teachingFocus.primaryFocus}
                      </div>
                      <div className="text-xs text-gray-600">Focus</div>
                    </div>

                    <div className="text-center p-3 bg-white rounded-lg border">
                      <Volume2 className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <div className="text-xs font-medium text-gray-900 capitalize">
                        {activeTeacher.voiceConfig.voice}
                      </div>
                      <div className="text-xs text-gray-600">Voice</div>
                    </div>

                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl mb-1">
                        {getAccentFlag(activeTeacher.voiceConfig.accent)}
                      </div>
                      <div className="text-xs font-medium text-gray-900 capitalize">
                        {activeTeacher.voiceConfig.accent}
                      </div>
                      <div className="text-xs text-gray-600">Accent</div>
                    </div>
                  </div>
                </div>

                {/* Lesson Preview */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                    What to Expect in This Lesson
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Volume2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">Voice & Text Practice</h5>
                        <p className="text-sm text-gray-600">
                          Speak naturally or type your responses
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">Real-time Feedback</h5>
                        <p className="text-sm text-gray-600">
                          Get corrections and suggestions as you practice
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">Personalized Teaching</h5>
                        <p className="text-sm text-gray-600">
                          {activeTeacher.teachingStyle.formality} style, {activeTeacher.teachingStyle.encouragementLevel} encouragement
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <PlayCircle className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">Interactive Scenarios</h5>
                        <p className="text-sm text-gray-600">
                          Practice {lessonType.toLowerCase()} in realistic situations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teacher's Specialization Notice */}
                {activeTeacher.teachingFocus.primaryFocus === lessonType.toLowerCase() && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-900">Perfect Match!</p>
                        <p className="text-sm text-green-700">
                          {activeTeacher.name} specializes in {lessonType.toLowerCase()} lessons like this one.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleStartWithTeacher}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center"
                  >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Start Lesson with {activeTeacher.name}
                  </button>
                  
                  <button
                    onClick={() => setShowTeacherSettings(true)}
                    className="px-6 py-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Choose Different Teacher
                  </button>
                </div>

                {/* Quick Tips */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Pro Tip:</strong> {activeTeacher.name} responds best to {activeTeacher.teachingStyle.personality} interactions. {activeTeacher.personality.motivationalStyle.toLowerCase()}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your AI Teacher</h3>
                <p className="text-gray-600 mb-6">
                  Select a teacher to personalize your learning experience
                </p>
                <button
                  onClick={() => setShowTeacherSettings(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose Teacher
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Teacher Settings Modal */}
      {showTeacherSettings && (
        <TeacherProfileSettings onClose={() => setShowTeacherSettings(false)} />
      )}
    </>
  );
}