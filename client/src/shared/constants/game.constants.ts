/**
 * Client-specific game constants for EveryTriv
 * Re-exports shared constants and adds client-only constants
 */

// Re-export shared constants
export {
  CUSTOM_DIFFICULTY_PREFIX,
  DIFFICULTY_LEVELS,
  VALID_DIFFICULTIES,
  DIFFICULTY_MULTIPLIERS,
  CUSTOM_DIFFICULTY_MULTIPLIERS,
  VALID_QUESTION_COUNTS,
  VALIDATION_LIMITS,
  QUEUE_CONFIG,
  PRIORITIES,
  CUSTOM_DIFFICULTY_KEYWORDS,
  GENERAL_DIFFICULTY_SUGGESTIONS
} from '../../../../shared/constants/game.constants';

// Import shared constants for use in client-specific constants
import { DIFFICULTY_LEVELS } from '../../../../shared/constants/game.constants';

// Client-specific constants only

// Scoring system constants
export const SCORING_DEFAULTS = {
  BASE_POINTS: 100,
  STREAK: 0,
  DIFFICULTY: DIFFICULTY_LEVELS.EASY,
  ANSWER_COUNT: 4,
  MAX_STREAK_BONUS: 10,
  STREAK_MULTIPLIER: 0.1,
  TIME_BONUS_MULTIPLIER: 0.5,
} as const;

// Answer count multipliers
export const ANSWER_COUNT_MULTIPLIERS = {
  3: 1,
  4: 1.2,
  5: 1.4,
} as const;

// Game mode limits
export const GAME_LIMITS = {
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 50,
  MIN_TIME_SECONDS: 30,
  MAX_TIME_SECONDS: 3600, // 1 hour
  DEFAULT_TIME_LIMIT: 300, // 5 minutes
  DEFAULT_QUESTION_LIMIT: 10,
} as const;

// Difficulty badge CSS classes (client-specific)
export const DIFFICULTY_BADGE_CLASSES = {
  [DIFFICULTY_LEVELS.EASY]: 'bg-green-500',
  [DIFFICULTY_LEVELS.MEDIUM]: 'bg-yellow-500',
  [DIFFICULTY_LEVELS.HARD]: 'bg-red-500',
  CUSTOM: 'bg-blue-500',
  DEFAULT: 'bg-blue-600',
} as const;

// Topic-specific difficulty suggestions (client-specific)
export const TOPIC_DIFFICULTY_SUGGESTIONS = {
  science: [
    'elementary science facts',
    'high school chemistry',
    'university physics',
    'graduate level biology',
    'research scientist knowledge'
  ],
  sports: [
    'casual fan knowledge',
    'sports enthusiast level',
    'professional athlete knowledge',
    'sports analyst expertise'
  ],
  history: [
    'basic historical facts',
    'high school world history',
    'university historical analysis',
    'professional historian level'
  ],
  cooking: [
    'beginner home cook',
    'intermediate cooking skills',
    'professional chef level',
    'culinary expert knowledge'
  ],
  music: [
    'casual music fan',
    'music student level', 
    'professional musician',
    'music theory expert'
  ],
  technology: [
    'basic computer user',
    'IT professional level',
    'software developer',
    'computer science expert'
  ],
  art: [
    'art appreciation level',
    'art student knowledge',
    'professional artist',
    'art historian expert'
  ]
} as const;
