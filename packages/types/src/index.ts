// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'microsoft' | 'apple';
  providerId: string;
  subscriptionTier: 'free' | 'premium' | 'business' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Learning Profile Types
export interface LearningProfile {
  id: string;
  userId: string;
  currentLevel: EnglishLevel;
  targetLevel?: EnglishLevel;
  learningGoals: LearningGoal[];
  nativeLanguage: string;
  weeklyGoalMinutes: number;
  preferredSchedule: {
    days: string[];
    timeSlots: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type LearningGoal = 'business' | 'travel' | 'academic' | 'conversation' | 'general';

// Conversation Types
export interface ConversationScenario {
  id: string;
  lessonId?: string;
  name: string;
  context: string;
  aiPersona: AIPersona;
  successCriteria: SuccessCriteria;
  maxDuration: number;
  vocabulary?: string[];
  usefulPhrases?: string[];
}

export interface AIPersona {
  id: string;
  name: string;
  role: string;
  personality: string;
  accent: 'american' | 'british' | 'australian' | 'canadian';
  specialties: string[];
  adaptability: number;
}

export interface SuccessCriteria {
  minExchanges: number;
  useTargetVocab: number;
  correctGrammar: number;
  completionGoals: string[];
}

export interface ConversationSession {
  id: string;
  userId: string;
  scenarioId: string;
  status: 'active' | 'completed' | 'abandoned';
  durationSeconds: number;
  messagesCount: number;
  score?: ConversationScore;
  feedback?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface ConversationScore {
  fluency: number;
  grammar: number;
  vocabulary: number;
  pronunciation?: number;
  overall: number;
}

export interface Message {
  id: string;
  sessionId: string;
  sender: 'user' | 'ai';
  content: string;
  audioUrl?: string;
  corrections?: Correction[];
  timestamp: Date;
}

export interface Correction {
  original: string;
  corrected: string;
  type: 'grammar' | 'vocabulary' | 'pronunciation' | 'style';
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

// Learning Path Types
export interface LearningPath {
  id: string;
  name: string;
  description: string;
  levelRange: string;
  category: string;
  totalLessons: number;
  estimatedHours: number;
  isActive: boolean;
}

export interface Lesson {
  id: string;
  pathId: string;
  orderIndex: number;
  title: string;
  description: string;
  scenarioType: string;
  learningObjectives: string[];
  vocabulary: VocabularyItem[];
  grammarFocus: string[];
  difficultyLevel: number;
  estimatedDuration: number;
}

export interface VocabularyItem {
  word: string;
  definition: string;
  example: string;
  level: EnglishLevel;
}

// Progress Tracking Types
export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  timeSpent: number;
  attempts: number;
  completedAt?: Date;
}

export interface LearningAnalytics {
  id: string;
  userId: string;
  date: Date;
  minutesPracticed: number;
  lessonsCompleted: number;
  conversationsCount: number;
  averageScore?: number;
  strengths: string[];
  weaknesses: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// AI Service Types
export interface AIConversationRequest {
  message: string;
  sessionId: string;
  context: ConversationScenario;
  userLevel: EnglishLevel;
  userWeaknesses?: string[];
}

export interface AIConversationResponse {
  response: string;
  corrections: Correction[];
  suggestions: string[];
  encouragement: string;
  audioUrl?: string;
  nextTopics?: string[];
}

// Socket Events
export interface ClientToServerEvents {
  'conversation:join': (data: { sessionId: string }) => void;
  'conversation:message': (data: { sessionId: string; message: string }) => void;
  'conversation:typing': (data: { sessionId: string }) => void;
  'conversation:leave': (data: { sessionId: string }) => void;
}

export interface ServerToClientEvents {
  'conversation:message': (data: Message) => void;
  'conversation:typing': (data: { sender: 'ai' }) => void;
  'conversation:correction': (data: Correction) => void;
  'conversation:session_updated': (data: ConversationSession) => void;
  'error': (data: { message: string }) => void;
}