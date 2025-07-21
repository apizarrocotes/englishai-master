// Configuration constants and utilities for EnglishAI Master

export const APP_CONFIG = {
  name: 'EnglishAI Master',
  version: '1.0.0',
  description: 'AI-powered English learning platform',
} as const;

export const API_ENDPOINTS = {
  auth: '/api/auth',
  users: '/api/users',
  conversations: '/api/conversations',
  learning: '/api/learning',
  analytics: '/api/analytics',
} as const;

export const ENGLISH_LEVELS = [
  'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
] as const;

export const LEARNING_GOALS = [
  'business',
  'travel', 
  'academic',
  'conversation',
  'general'
] as const;

export const SUBSCRIPTION_TIERS = [
  'free',
  'premium',
  'business', 
  'enterprise'
] as const;

export const AI_ACCENTS = [
  'american',
  'british',
  'australian',
  'canadian'
] as const;

export const CONVERSATION_STATUS = [
  'active',
  'completed',
  'abandoned'
] as const;

export const MESSAGE_TYPES = [
  'user',
  'ai'
] as const;

export const CORRECTION_TYPES = [
  'grammar',
  'vocabulary',
  'pronunciation',
  'style'
] as const;

export const CORRECTION_SEVERITY = [
  'low',
  'medium',
  'high'
] as const;