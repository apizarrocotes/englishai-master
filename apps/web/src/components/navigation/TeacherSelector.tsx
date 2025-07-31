'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Settings, 
  Crown, 
  Volume2,
  User,
  Sparkles
} from 'lucide-react';
import { useActiveTeacher, getPersonalityIcon, getFocusIcon, getAccentFlag } from '@/hooks/useActiveTeacher';
import TeacherProfileSettings from '@/components/settings/TeacherProfileSettings';

export default function TeacherSelector() {
  const { activeTeacher, loading } = useActiveTeacher();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="hidden md:block">
          <div className="h-3 bg-gray-200 rounded w-20 mb-1" />
          <div className="h-2 bg-gray-200 rounded w-16" />
        </div>
      </div>
    );
  }

  if (!activeTeacher) {
    return (
      <button
        onClick={() => setShowSettings(true)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-gray-500" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-700">Choose Teacher</p>
          <p className="text-xs text-gray-500">Not selected</p>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
        
        {showSettings && (
          <TeacherProfileSettings onClose={() => setShowSettings(false)} />
        )}
      </button>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm">
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
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                <Crown className="w-2 h-2 text-yellow-800" />
              </div>
            )}
          </div>
          
          <div className="hidden md:block text-left">
            <div className="flex items-center space-x-1">
              <p className="text-sm font-medium text-gray-900">{activeTeacher.name}</p>
              {activeTeacher.isSystemProfile && (
                <Sparkles className="w-3 h-3 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>{getPersonalityIcon(activeTeacher.teachingStyle.personality)}</span>
              <span className="capitalize">{activeTeacher.teachingStyle.personality}</span>
              <span>•</span>
              <span>{getAccentFlag(activeTeacher.voiceConfig.accent)}</span>
            </div>
          </div>
          
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform group-hover:text-gray-600 ${
            showDropdown ? 'rotate-180' : ''
          }`} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
              onMouseLeave={() => setShowDropdown(false)}
            >
              {/* Current Teacher Info */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm">
                      <img 
                        src={activeTeacher.personality.avatarUrl} 
                        alt={activeTeacher.personality.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {activeTeacher.isSystemProfile && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Crown className="w-2 h-2 text-yellow-800" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">{activeTeacher.name}</h4>
                      {activeTeacher.isSystemProfile && (
                        <div className="flex items-center bg-yellow-100 text-yellow-800 rounded-full px-2 py-1">
                          <Sparkles className="w-3 h-3 mr-1" />
                          <span className="text-xs font-medium">Premium</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{activeTeacher.personality.title}</p>
                    <p className="text-xs text-blue-700 italic mt-1">
                      "{activeTeacher.personality.catchPhrases[0]}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Teacher Details */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg mb-1">
                      {getPersonalityIcon(activeTeacher.teachingStyle.personality)}
                    </div>
                    <div className="text-xs font-medium text-gray-900 capitalize">
                      {activeTeacher.teachingStyle.personality}
                    </div>
                    <div className="text-xs text-gray-600">Style</div>
                  </div>

                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg mb-1">
                      {getFocusIcon(activeTeacher.teachingFocus.primaryFocus)}
                    </div>
                    <div className="text-xs font-medium text-gray-900 capitalize">
                      {activeTeacher.teachingFocus.primaryFocus}
                    </div>
                    <div className="text-xs text-gray-600">Focus</div>
                  </div>

                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Volume2 className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <div className="text-xs font-medium text-gray-900 capitalize">
                      {activeTeacher.voiceConfig.voice}
                    </div>
                    <div className="text-xs text-gray-600">Voice</div>
                  </div>

                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg mb-1">
                      {getAccentFlag(activeTeacher.voiceConfig.accent)}
                    </div>
                    <div className="text-xs font-medium text-gray-900 capitalize">
                      {activeTeacher.voiceConfig.accent}
                    </div>
                    <div className="text-xs text-gray-600">Accent</div>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Specialties:</p>
                  <div className="flex flex-wrap gap-1">
                    {activeTeacher.personality.specialties.map((specialty, idx) => (
                      <span key={idx} className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowSettings(true);
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Change AI Teacher
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <TeacherProfileSettings onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}