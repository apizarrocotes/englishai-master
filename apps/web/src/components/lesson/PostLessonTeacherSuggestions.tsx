'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Award, 
  Target, 
  Crown,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Volume2,
  X
} from 'lucide-react';
import { useActiveTeacher, getPersonalityIcon, getFocusIcon, getAccentFlag } from '@/hooks/useActiveTeacher';
import { systemTeachers } from '@/types/TeacherProfile';
import TeacherProfileSettings from '@/components/settings/TeacherProfileSettings';

interface LessonPerformance {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  lessonType: string;
  difficultyLevel: number;
  timeSpent: number;
  vocabularyScore: number;
  grammarScore: number;
  pronunciationScore: number;
  fluencyScore: number;
}

interface PostLessonTeacherSuggestionsProps {
  performance: LessonPerformance;
  onClose: () => void;
  onSuggestionAccepted: (teacherId: string) => void;
}

export default function PostLessonTeacherSuggestions({
  performance,
  onClose,
  onSuggestionAccepted
}: PostLessonTeacherSuggestionsProps) {
  const { activeTeacher } = useActiveTeacher();
  const [suggestedTeacher, setSuggestedTeacher] = useState<any>(null);
  const [showTeacherSettings, setShowTeacherSettings] = useState(false);
  const [reasoning, setReasoning] = useState<string>('');

  useEffect(() => {
    const suggestion = generateTeacherSuggestion();
    setSuggestedTeacher(suggestion.teacher);
    setReasoning(suggestion.reasoning);
  }, [performance, activeTeacher]);

  const generateTeacherSuggestion = () => {
    if (!activeTeacher) return { teacher: null, reasoning: '' };

    // Don't suggest if current teacher is already optimal
    if (performance.overallScore >= 85) {
      return {
        teacher: null,
        reasoning: `Excellent performance with ${activeTeacher.name}! Continue with your current teacher.`
      };
    }

    let bestMatch = null;
    let reason = '';

    // Analyze performance weaknesses
    const needsGrammarHelp = performance.grammarScore < 70;
    const needsPronunciationHelp = performance.pronunciationScore < 70;
    const needsFluencyHelp = performance.fluencyScore < 70;
    const needsVocabularyHelp = performance.vocabularyScore < 70;
    const isStruggling = performance.overallScore < 60;
    const needsMoreEncouragement = performance.overallScore < 70 && performance.timeSpent > 900; // 15+ minutes

    // Find teachers that aren't the current one
    const availableTeachers = systemTeachers.filter(t => t.id !== activeTeacher.id);

    if (needsGrammarHelp && performance.lessonType === 'grammar') {
      // Suggest Dr. Chen for grammar issues
      bestMatch = availableTeachers.find(t => t.id === 'dr-chen');
      reason = `Dr. Chen specializes in grammar instruction and could help improve your grammar score (${performance.grammarScore}%).`;
    } else if (needsPronunciationHelp || needsFluencyHelp) {
      // Suggest Coach Sarah for pronunciation/fluency
      bestMatch = availableTeachers.find(t => t.id === 'coach-sarah');
      reason = `Coach Sarah's energetic approach and pronunciation focus could boost your speaking confidence.`;
    } else if (needsMoreEncouragement || isStruggling) {
      // Suggest Ms. Rodriguez for encouragement
      bestMatch = availableTeachers.find(t => t.id === 'ms-rodriguez');
      reason = `Ms. Rodriguez's patient and encouraging style might help you feel more confident and improve your scores.`;
    } else if (performance.lessonType === 'business' || performance.lessonType === 'professional') {
      // Suggest Executive Thompson for business content
      bestMatch = availableTeachers.find(t => t.id === 'executive-thompson');
      reason = `Executive Thompson's business expertise could enhance your professional English skills.`;
    } else if (performance.difficultyLevel >= 4) {
      // Suggest Professor Hamilton for advanced content
      bestMatch = availableTeachers.find(t => t.id === 'professor-hamilton');
      reason = `Professor Hamilton's academic approach might help you tackle more challenging content effectively.`;
    } else if (needsVocabularyHelp || performance.lessonType === 'conversation') {
      // Suggest Zoe for vocabulary and casual conversation
      bestMatch = availableTeachers.find(t => t.id === 'zoe');
      reason = `Zoe's casual conversation style could help expand your vocabulary naturally.`;
    }

    // Fallback: suggest a teacher with different teaching style
    if (!bestMatch) {
      const currentPersonality = activeTeacher.teachingStyle.personality;
      bestMatch = availableTeachers.find(t => 
        t.teachingStyle.personality !== currentPersonality
      ) || availableTeachers[0];
      
      reason = `A different teaching style might give you a fresh perspective on your learning.`;
    }

    return { teacher: bestMatch, reasoning: reason };
  };

  const getPerformanceInsight = () => {
    if (performance.overallScore >= 90) return { icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Outstanding Performance!' };
    if (performance.overallScore >= 80) return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', text: 'Great Progress!' };
    if (performance.overallScore >= 70) return { icon: Target, color: 'text-blue-600', bg: 'bg-blue-50', text: 'Good Work!' };
    return { icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-50', text: 'Keep Practicing!' };
  };

  const handleAcceptSuggestion = () => {
    if (suggestedTeacher) {
      onSuggestionAccepted(suggestedTeacher.id);
      onClose();
    }
  };

  if (!suggestedTeacher) {
    return (
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
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfect Match!</h2>
              <p className="text-gray-600 mb-6">
                {reasoning}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue Learning
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const insight = getPerformanceInsight();

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
                <div className="flex items-center space-x-3">
                  <insight.icon className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">{insight.text}</h2>
                    <p className="text-blue-100">Lesson Complete • Score: {performance.overallScore}%</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Performance Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Performance Breakdown
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{performance.vocabularyScore}%</div>
                    <div className="text-xs text-gray-600">Vocabulary</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{performance.grammarScore}%</div>
                    <div className="text-xs text-gray-600">Grammar</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{performance.pronunciationScore}%</div>
                    <div className="text-xs text-gray-600">Pronunciation</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{performance.fluencyScore}%</div>
                    <div className="text-xs text-gray-600">Fluency</div>
                  </div>
                </div>

                {performance.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-green-800 mb-1">Strengths:</p>
                    <div className="flex flex-wrap gap-1">
                      {performance.strengths.map((strength, idx) => (
                        <span key={idx} className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-1">
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {performance.weaknesses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-orange-800 mb-1">Areas to improve:</p>
                    <div className="flex flex-wrap gap-1">
                      {performance.weaknesses.map((weakness, idx) => (
                        <span key={idx} className="text-xs bg-orange-100 text-orange-800 rounded-full px-2 py-1">
                          {weakness}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Teacher Suggestion */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                      AI Teacher Recommendation
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">{reasoning}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg">
                      <img 
                        src={suggestedTeacher.personality.avatarUrl} 
                        alt={suggestedTeacher.personality.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Crown className="w-3 h-3 text-yellow-800" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-lg font-semibold text-gray-900">{suggestedTeacher.name}</h4>
                      <div className="flex items-center bg-yellow-100 text-yellow-800 rounded-full px-2 py-1">
                        <Sparkles className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">Premium</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{suggestedTeacher.personality.title}</p>
                    <p className="text-sm text-blue-700 italic">
                      "{suggestedTeacher.personality.catchPhrases[0]}"
                    </p>
                  </div>
                </div>

                {/* Teacher Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-lg mb-1">
                      {getPersonalityIcon(suggestedTeacher.teachingStyle.personality)}
                    </div>
                    <div className="text-xs font-medium text-gray-900 capitalize">
                      {suggestedTeacher.teachingStyle.personality}
                    </div>
                    <div className="text-xs text-gray-600">Style</div>
                  </div>

                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-lg mb-1">
                      {getFocusIcon(suggestedTeacher.teachingFocus.primaryFocus)}
                    </div>
                    <div className="text-xs font-medium text-gray-900 capitalize">
                      {suggestedTeacher.teachingFocus.primaryFocus}
                    </div>
                    <div className="text-xs text-gray-600">Focus</div>
                  </div>

                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Volume2 className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <div className="text-xs font-medium text-gray-900 capitalize">
                      {suggestedTeacher.voiceConfig.voice}
                    </div>
                    <div className="text-xs text-gray-600">Voice</div>
                  </div>

                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-lg mb-1">
                      {getAccentFlag(suggestedTeacher.voiceConfig.accent)}
                    </div>
                    <div className="text-xs font-medium text-gray-900 capitalize">
                      {suggestedTeacher.voiceConfig.accent}
                    </div>
                    <div className="text-xs text-gray-600">Accent</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleAcceptSuggestion}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Switch to {suggestedTeacher.name}
                </button>
                
                <button
                  onClick={() => setShowTeacherSettings(true)}
                  className="px-6 py-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  View All Teachers
                </button>
                
                <button
                  onClick={onClose}
                  className="px-6 py-4 text-gray-500 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Keep Current
                </button>
              </div>

              {/* Performance Tip */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>💡 Performance Tip:</strong> Different teachers excel in different areas. Switching teachers periodically can provide fresh perspectives and accelerate your learning.
                </p>
              </div>
            </div>
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