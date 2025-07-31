import { useState, useEffect } from 'react';
import { TeacherProfile } from '@/types/TeacherProfile';
import { TokenStorage } from '@/lib/auth';

export const useActiveTeacher = () => {
  const [activeTeacher, setActiveTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveTeacher = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = TokenStorage.getAccessToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://89.58.17.78:3001';
      console.log('🔍 Fetching active teacher from:', `${apiUrl}/api/teacher-profiles/active`);
      console.log('🔑 Using token:', token ? 'present' : 'missing');
      
      const response = await fetch(`${apiUrl}/api/teacher-profiles/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to fetch active teacher: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      setActiveTeacher(data.data);
    } catch (error) {
      console.error('Error fetching active teacher:', error);
      setError((error as Error).message);
      
      // Fallback to default teacher if API fails
      setActiveTeacher({
        id: 'default',
        name: 'Professor Hamilton',
        isSystemProfile: true,
        description: 'Distinguished British academic teacher',
        personality: {
          name: 'Professor Charles Hamilton',
          title: 'Professor',
          background: 'Oxford graduate with 20+ years teaching experience',
          specialties: ['British English', 'Academic Writing', 'Advanced Grammar'],
          catchPhrases: ['Quite right, let\'s proceed properly', 'Excellent observation, well done'],
          motivationalStyle: 'Dignified encouragement',
          avatarUrl: '/avatars/professor-hamilton.jpg',
          bannerColor: '#1e3a8a'
        },
        voiceConfig: {
          voice: 'echo',
          speed: 0.9,
          accent: 'british'
        },
        teachingStyle: {
          personality: 'academic',
          formality: 'very_formal',
          correctionStyle: 'immediate',
          encouragementLevel: 'moderate',
          adaptability: 7
        },
        teachingFocus: {
          primaryFocus: 'grammar',
          secondaryFocus: 'vocabulary',
          detailLevel: 'expert',
          methodology: 'structural'
        },
        systemPromptTemplate: 'You are Professor Hamilton...',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTeacher();
  }, []);

  return {
    activeTeacher,
    loading,
    error,
    refetch: fetchActiveTeacher
  };
};

// Helper functions for UI
export const getPersonalityIcon = (personality: string) => {
  const icons = {
    strict: '👨‍🏫',
    friendly: '😊',
    patient: '🕊️',
    energetic: '⚡',
    motivational: '🎯',
    academic: '🎓',
    casual: '😎'
  };
  return icons[personality as keyof typeof icons] || '👨‍🏫';
};

export const getFocusIcon = (focus: string) => {
  const icons = {
    conversation: '💬',
    grammar: '📝',
    pronunciation: '🗣️',
    vocabulary: '📚',
    business: '💼',
    academic: '🏛️'
  };
  return icons[focus as keyof typeof icons] || '📚';
};

export const getAccentFlag = (accent: string) => {
  const flags = {
    american: '🇺🇸',
    british: '🇬🇧',
    australian: '🇦🇺',
    canadian: '🇨🇦',
    neutral: '🌍'
  };
  return flags[accent as keyof typeof flags] || '🌍';
};