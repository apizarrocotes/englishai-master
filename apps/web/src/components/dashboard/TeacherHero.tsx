'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Crown, 
  Volume2, 
  MessageCircle,
  Sparkles,
  ChevronRight,
  User
} from 'lucide-react';
import { useActiveTeacher, getPersonalityIcon, getFocusIcon, getAccentFlag } from '@/hooks/useActiveTeacher';
import TeacherProfileSettings from '@/components/settings/TeacherProfileSettings';

export default function TeacherHero() {
  const { activeTeacher, loading, error } = useActiveTeacher();
  const [showSettings, setShowSettings] = useState(false);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-8"
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-6 bg-white bg-opacity-20 rounded animate-pulse mb-2" />
            <div className="h-4 bg-white bg-opacity-20 rounded animate-pulse w-3/4" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (error || !activeTeacher) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl p-6 text-white mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Choose Your AI Teacher</h3>
              <p className="text-gray-100">Get started with personalized English learning</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="px-6 py-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all flex items-center"
          >
            <Settings className="w-5 h-5 mr-2" />
            Choose Teacher
          </button>
        </div>
        {showSettings && (
          <TeacherProfileSettings onClose={() => setShowSettings(false)} />
        )}
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl mb-8"
        style={{ 
          background: `linear-gradient(135deg, ${activeTeacher.personality.bannerColor} 0%, ${activeTeacher.personality.bannerColor}CC 100%)` 
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Teacher Avatar */}
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
                {/* System Profile Badge */}
                {activeTeacher.isSystemProfile && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Crown className="w-3 h-3 text-yellow-800" />
                  </div>
                )}
              </div>

              {/* Teacher Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-xl font-semibold">{activeTeacher.name}</h3>
                  {activeTeacher.isSystemProfile && (
                    <div className="flex items-center bg-white bg-opacity-20 rounded-full px-2 py-1">
                      <Sparkles className="w-3 h-3 mr-1" />
                      <span className="text-xs font-medium">Premium</span>
                    </div>
                  )}
                </div>
                
                <div className="mb-2">
                  <p className="text-white text-opacity-90 text-sm">
                    "{activeTeacher.personality.catchPhrases[0]}"
                  </p>
                </div>

                {/* Teacher Features */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <span className="mr-2">{getPersonalityIcon(activeTeacher.teachingStyle.personality)}</span>
                    <span className="capitalize">{activeTeacher.teachingStyle.personality}</span>
                  </div>
                  
                  <div className="flex items-center bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <span className="mr-2">{getFocusIcon(activeTeacher.teachingFocus.primaryFocus)}</span>
                    <span className="capitalize">{activeTeacher.teachingFocus.primaryFocus}</span>
                  </div>
                  
                  <div className="flex items-center bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <Volume2 className="w-3 h-3 mr-2" />
                    <span className="capitalize">{activeTeacher.voiceConfig.voice}</span>
                  </div>
                  
                  <div className="flex items-center bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <span className="mr-2">{getAccentFlag(activeTeacher.voiceConfig.accent)}</span>
                    <span className="capitalize">{activeTeacher.voiceConfig.accent}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all flex items-center text-sm font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                Change Teacher
              </button>
              
              <div className="text-right text-xs text-white text-opacity-75">
                <p>{activeTeacher.teachingStyle.formality} • {activeTeacher.teachingFocus.detailLevel} level</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span>Ready for conversation practice</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                  <span>Online now</span>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-white text-opacity-75">
                <span>Specialized in:</span>
                <div className="ml-2 flex space-x-1">
                  {activeTeacher.personality.specialties.slice(0, 2).map((specialty, idx) => (
                    <span key={idx} className="bg-white bg-opacity-20 rounded px-2 py-1">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Settings Modal */}
      {showSettings && (
        <TeacherProfileSettings onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}