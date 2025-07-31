'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  User, 
  Mic, 
  BookOpen, 
  Star,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Volume2,
  MessageCircle,
  Crown,
  Sparkles,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { 
  TeacherProfile, 
  UserTeacherPreferences,
  VOICE_OPTIONS,
  ACCENT_OPTIONS,
  PERSONALITY_OPTIONS,
  TEACHING_FOCUS_OPTIONS
} from '@/types/TeacherProfile';
import { TokenStorage } from '@/lib/auth';

interface TeacherProfileSettingsProps {
  onClose?: () => void;
}

export default function TeacherProfileSettings({ onClose }: TeacherProfileSettingsProps) {
  const [profiles, setProfiles] = useState<TeacherProfile[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserTeacherPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showCreateCustom, setShowCreateCustom] = useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = TokenStorage.getAccessToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://89.58.17.78:3001';

      console.log('🔍 Loading teacher profiles from:', `${apiUrl}/api/teacher-profiles`);
      console.log('🔑 Using token:', token ? 'present' : 'missing');

      // Load available profiles
      const profilesResponse = await fetch(`${apiUrl}/api/teacher-profiles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Profiles response status:', profilesResponse.status);
      console.log('📡 Profiles response ok:', profilesResponse.ok);

      if (!profilesResponse.ok) {
        const errorText = await profilesResponse.text();
        console.error('❌ Profiles API Error:', errorText);
        throw new Error(`Failed to load teacher profiles: ${profilesResponse.status} - ${errorText}`);
      }

      const profilesData = await profilesResponse.json();
      console.log('✅ Profiles data:', profilesData);
      setProfiles(profilesData.data || []);

      // Load user preferences
      console.log('🔍 Loading user preferences from:', `${apiUrl}/api/teacher-profiles/user-preferences`);
      const preferencesResponse = await fetch(`${apiUrl}/api/teacher-profiles/user-preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Preferences response status:', preferencesResponse.status);

      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json();
        console.log('✅ Preferences data:', preferencesData);
        setUserPreferences(preferencesData.data);
        setSelectedProfileId(preferencesData.data?.selectedProfileId || null);
      } else {
        const errorText = await preferencesResponse.text();
        console.warn('⚠️ Preferences API Error (non-critical):', errorText);
      }

    } catch (error) {
      console.error('❌ Error loading teacher profile data:', error);
      setError(`Failed to load teacher profiles. Please try again. Details: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = async (profileId: string) => {
    try {
      const token = TokenStorage.getAccessToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://89.58.17.78:3001';

      console.log('🔍 Selecting teacher profile:', profileId);
      console.log('🔑 Using token:', token ? 'present' : 'missing');
      console.log('📡 API URL:', `${apiUrl}/api/teacher-profiles/user-preferences`);

      const response = await fetch(`${apiUrl}/api/teacher-profiles/user-preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Update preferences API Error:', errorText);
        throw new Error(`Failed to update preferences: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Update preferences response:', data);
      setUserPreferences(data.data);
      setSelectedProfileId(profileId);
      
      // Show success feedback
      setError(null);
    } catch (error) {
      console.error('❌ Error selecting teacher profile:', error);
      setError(`Failed to update your teacher preference. Please try again. Details: ${(error as Error).message}`);
    }
  };

  const getProfileIcon = (profile: TeacherProfile) => {
    if (profile.isSystemProfile) {
      return <Crown className="w-4 h-4 text-yellow-500" />;
    }
    return <User className="w-4 h-4 text-blue-500" />;
  };

  const getPersonalityIcon = (personality: string) => {
    const option = PERSONALITY_OPTIONS.find(opt => opt.value === personality);
    return option?.icon || '👨‍🏫';
  };

  const getFocusIcon = (focus: string) => {
    const option = TEACHING_FOCUS_OPTIONS.find(opt => opt.value === focus);
    return option?.icon || '📚';
  };

  const getVoiceLabel = (voice: string) => {
    const option = VOICE_OPTIONS.find(opt => opt.value === voice);
    return option?.label || voice;
  };

  const getAccentFlag = (accent: string) => {
    const option = ACCENT_OPTIONS.find(opt => opt.value === accent);
    return option?.flag || '🌍';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading your AI teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your AI English Teachers</h2>
                <p className="text-blue-100">Choose your perfect learning companion</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* System Profiles */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
                Premium AI Teachers
              </h3>
              <div className="text-sm text-gray-500">
                {profiles.filter(p => p.isSystemProfile).length} professional teachers
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.filter(profile => profile.isSystemProfile).map((profile) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative rounded-xl border-2 transition-all cursor-pointer ${
                    selectedProfileId === profile.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => handleSelectProfile(profile.id)}
                >
                  {/* Selection Indicator */}
                  {selectedProfileId === profile.id && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white fill-current" />
                    </div>
                  )}

                  {/* Banner */}
                  <div 
                    className="h-16 rounded-t-xl"
                    style={{ backgroundColor: profile.personality.bannerColor }}
                  />

                  {/* Avatar */}
                  <div className="relative -mt-8 text-center">
                    <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg">
                      <img 
                        src={profile.personality.avatarUrl} 
                        alt={profile.personality.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/avatars/default-teacher.jpg';
                        }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 pt-2">
                    <div className="text-center mb-3">
                      <h4 className="font-semibold text-gray-900 flex items-center justify-center">
                        {getProfileIcon(profile)}
                        <span className="ml-1">{profile.name}</span>
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{profile.personality.title}</p>
                    </div>

                    <p className="text-sm text-gray-600 text-center mb-3 line-clamp-2">
                      {profile.description}
                    </p>

                    {/* Key Features */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Personality:</span>
                        <span className="flex items-center">
                          <span className="mr-1">{getPersonalityIcon(profile.teachingStyle.personality)}</span>
                          {profile.teachingStyle.personality}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Focus:</span>
                        <span className="flex items-center">
                          <span className="mr-1">{getFocusIcon(profile.teachingFocus.primaryFocus)}</span>
                          {profile.teachingFocus.primaryFocus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Voice:</span>
                        <span className="flex items-center">
                          <Volume2 className="w-3 h-3 mr-1" />
                          {getVoiceLabel(profile.voiceConfig.voice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Accent:</span>
                        <span className="flex items-center">
                          <span className="mr-1">{getAccentFlag(profile.voiceConfig.accent)}</span>
                          {profile.voiceConfig.accent}
                        </span>
                      </div>
                    </div>

                    {/* Expand Details Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedProfileId(expandedProfileId === profile.id ? null : profile.id);
                      }}
                      className="w-full mt-3 text-xs text-blue-600 hover:text-blue-700 flex items-center justify-center"
                    >
                      {expandedProfileId === profile.id ? (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-3 h-3 mr-1" />
                          View Details
                        </>
                      )}
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedProfileId === profile.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 border-t border-gray-200 overflow-hidden"
                        >
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="font-medium text-gray-700">Specialties:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {profile.personality.specialties.map((specialty, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                    {specialty}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Teaching Style:</span>
                              <p className="text-gray-600 mt-1">{profile.personality.motivationalStyle}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Typical Phrases:</span>
                              <div className="mt-1">
                                {profile.personality.catchPhrases.slice(0, 2).map((phrase, idx) => (
                                  <p key={idx} className="text-gray-600 italic">"{phrase}"</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Custom Profiles Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 text-blue-500 mr-2" />
                Your Custom Teachers
              </h3>
              <button
                onClick={() => setShowCreateCustom(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Teacher
              </button>
            </div>

            {profiles.filter(profile => !profile.isSystemProfile).length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Custom Teachers Yet</h4>
                <p className="text-gray-600 mb-4">Create your own personalized AI teacher with custom personality, voice, and teaching style.</p>
                <button
                  onClick={() => setShowCreateCustom(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Custom Teacher
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.filter(profile => !profile.isSystemProfile).map((profile) => (
                  <div key={profile.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    {/* Custom profile implementation would go here */}
                    <p className="text-gray-600">Custom profile: {profile.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Teacher Summary */}
          {selectedProfileId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                Your Active AI Teacher
              </h3>
              {(() => {
                const activeProfile = profiles.find(p => p.id === selectedProfileId);
                if (!activeProfile) return null;

                return (
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <img 
                        src={activeProfile.personality.avatarUrl} 
                        alt={activeProfile.personality.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/avatars/default-teacher.jpg';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{activeProfile.name}</h4>
                      <p className="text-sm text-gray-600">{activeProfile.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <span className="mr-1">{getPersonalityIcon(activeProfile.teachingStyle.personality)}</span>
                          {activeProfile.teachingStyle.personality}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">{getFocusIcon(activeProfile.teachingFocus.primaryFocus)}</span>
                          {activeProfile.teachingFocus.primaryFocus}
                        </span>
                        <span className="flex items-center">
                          <Volume2 className="w-3 h-3 mr-1" />
                          {getVoiceLabel(activeProfile.voiceConfig.voice)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            🎯 Your AI teacher adapts to your learning style and preferences
          </div>
          <div className="flex space-x-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            )}
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}