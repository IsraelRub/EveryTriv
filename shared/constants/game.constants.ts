/**
 * Shared game constants for EveryTriv
 * Used by both client and server
 */

// Custom difficulty constants
export const CUSTOM_DIFFICULTY_PREFIX = 'custom:';

// Standard difficulty levels
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium', 
  HARD: 'hard',
} as const;

// Valid difficulties including custom
export const VALID_DIFFICULTIES = ["easy", "medium", "hard", "custom"] as const;

// Difficulty multipliers for scoring
export const DIFFICULTY_MULTIPLIERS = {
  [DIFFICULTY_LEVELS.EASY]: 1,
  [DIFFICULTY_LEVELS.MEDIUM]: 1.5,
  [DIFFICULTY_LEVELS.HARD]: 2,
  CUSTOM_DEFAULT: 1.3,
} as const;

// Custom difficulty multipliers based on keywords
export const CUSTOM_DIFFICULTY_MULTIPLIERS = {
  EXPERT: 2.5,
  UNIVERSITY: 2.0,
  HIGH_SCHOOL: 1.5,
  ELEMENTARY: 1.0,
} as const;

// Question count options
export const VALID_QUESTION_COUNTS = [3, 4, 5] as const;

// Validation limits
export const VALIDATION_LIMITS = {
  TOPIC: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  CUSTOM_DIFFICULTY: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
  },
} as const;

// Queue configuration
export const QUEUE_CONFIG = {
  MAX_ITEMS: 1000,
  PROCESS_INTERVAL: 1000,
  RETRY_DELAY: 5000,
} as const;

// Priority levels
export const PRIORITIES = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
} as const;

// Custom difficulty keywords for detection
export const CUSTOM_DIFFICULTY_KEYWORDS = {
  LEVELS: [
    'beginner', 'elementary', 'basic', 'simple', 'easy',
    'intermediate', 'moderate', 'medium', 'standard', 'average',
    'advanced', 'expert', 'professional', 'complex', 'difficult', 'hard',
  ],
  EDUCATION: [
    'university', 'college', 'school', 'academic', 'graduate',
    'phd', 'master', 'bachelor', 'doctorate', 'undergraduate',
  ],
  DESCRIPTORS: [
    'level', 'grade', 'knowledge', 'skills',
  ],
} as const;

// General difficulty suggestions
export const GENERAL_DIFFICULTY_SUGGESTIONS = [
  'beginner level',
  'elementary school level',
  'high school level', 
  'college level',
  'university level',
  'professional level',
  'expert level'
] as const;
