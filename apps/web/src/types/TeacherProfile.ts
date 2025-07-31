// This file mirrors the backend types for frontend use

export interface TeacherVoiceConfig {
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed: number; // 0.25 - 4.0
  accent: 'american' | 'british' | 'australian' | 'canadian' | 'neutral';
}

export interface TeachingStyle {
  personality: 'strict' | 'friendly' | 'patient' | 'energetic' | 'motivational' | 'academic' | 'casual';
  formality: 'very_formal' | 'professional' | 'casual' | 'friendly';
  correctionStyle: 'immediate' | 'end_of_conversation' | 'critical_only' | 'never_interrupt';
  encouragementLevel: 'minimal' | 'moderate' | 'high' | 'maximum';
  adaptability: number; // 1-10
}

export interface TeachingFocus {
  primaryFocus: 'conversation' | 'grammar' | 'pronunciation' | 'vocabulary' | 'business' | 'academic';
  secondaryFocus?: 'conversation' | 'grammar' | 'pronunciation' | 'vocabulary' | 'business' | 'academic';
  detailLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  methodology: 'communicative' | 'structural' | 'immersive' | 'practical' | 'gamified';
}

export interface TeacherPersonality {
  name: string;
  title: string;
  background: string;
  specialties: string[];
  catchPhrases: string[];
  motivationalStyle: string;
  avatarUrl: string;
  bannerColor: string;
}

export interface TeacherProfile {
  id: string;
  userId?: string;
  isSystemProfile: boolean;
  name: string;
  description: string;
  personality: TeacherPersonality;
  voiceConfig: TeacherVoiceConfig;
  teachingStyle: TeachingStyle;
  teachingFocus: TeachingFocus;
  systemPromptTemplate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserTeacherPreferences {
  id: string;
  userId: string;
  selectedProfileId: string;
  customizations?: Partial<TeacherProfile>;
  createdAt: Date;
  updatedAt: Date;
}

// UI-specific types
export interface TeacherProfileCardProps {
  profile: TeacherProfile;
  isSelected: boolean;
  onSelect: (profileId: string) => void;
  onCustomize?: (profile: TeacherProfile) => void;
}

export interface TeacherCustomizationProps {
  profile: TeacherProfile;
  onSave: (customizations: Partial<TeacherProfile>) => void;
  onCancel: () => void;
}

export interface CreateCustomProfileProps {
  onSave: (profileData: Partial<TeacherProfile>) => void;
  onCancel: () => void;
}

// Voice options for UI dropdowns
export const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy (Neutral)', description: 'Clear and balanced voice' },
  { value: 'echo', label: 'Echo (Male)', description: 'Deep and resonant voice' },
  { value: 'fable', label: 'Fable (British)', description: 'Warm British accent' },
  { value: 'onyx', label: 'Onyx (Professional)', description: 'Authoritative and clear' },
  { value: 'nova', label: 'Nova (Female)', description: 'Friendly and energetic' },
  { value: 'shimmer', label: 'Shimmer (Soft)', description: 'Gentle and soothing' }
] as const;

export const ACCENT_OPTIONS = [
  { value: 'american', label: 'American English', flag: '🇺🇸' },
  { value: 'british', label: 'British English', flag: '🇬🇧' },
  { value: 'australian', label: 'Australian English', flag: '🇦🇺' },
  { value: 'canadian', label: 'Canadian English', flag: '🇨🇦' },
  { value: 'neutral', label: 'Neutral English', flag: '🌍' }
] as const;

export const PERSONALITY_OPTIONS = [
  { value: 'strict', label: 'Strict', icon: '👨‍🏫', description: 'Disciplined and demanding' },
  { value: 'friendly', label: 'Friendly', icon: '😊', description: 'Warm and approachable' },
  { value: 'patient', label: 'Patient', icon: '🕊️', description: 'Understanding and supportive' },
  { value: 'energetic', label: 'Energetic', icon: '⚡', description: 'Dynamic and motivating' },
  { value: 'motivational', label: 'Motivational', icon: '🎯', description: 'Inspiring and encouraging' },
  { value: 'academic', label: 'Academic', icon: '🎓', description: 'Scholarly and detailed' },
  { value: 'casual', label: 'Casual', icon: '😎', description: 'Relaxed and informal' }
] as const;

export const TEACHING_FOCUS_OPTIONS = [
  { value: 'conversation', label: 'Conversation', icon: '💬', description: 'Speaking fluency and dialogue' },
  { value: 'grammar', label: 'Grammar', icon: '📝', description: 'Structure and rules' },
  { value: 'pronunciation', label: 'Pronunciation', icon: '🗣️', description: 'Sound and accent' },
  { value: 'vocabulary', label: 'Vocabulary', icon: '📚', description: 'Word knowledge and usage' },
  { value: 'business', label: 'Business English', icon: '💼', description: 'Professional communication' },
  { value: 'academic', label: 'Academic English', icon: '🏛️', description: 'Formal and scholarly language' }
] as const;