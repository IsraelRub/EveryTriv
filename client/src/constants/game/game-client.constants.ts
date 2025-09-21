/**
 * Client-specific game constants for EveryTriv
 * Re-exports shared constants and adds client-only constants
 *
 * @module ClientGameConstants
 * @description Client game configuration and scoring constants
 * @used_by client/src/components/game (Game component), client/src/hooks/layers/business (useGameLogic hook)
 */

export {
  CUSTOM_DIFFICULTY_KEYWORDS,
  CUSTOM_DIFFICULTY_MULTIPLIERS,
  CUSTOM_DIFFICULTY_PREFIX,
  DIFFICULTY_MULTIPLIERS,
  DifficultyLevel,
  GameMode,
  VALID_DIFFICULTIES,
  VALID_QUESTION_COUNTS,
} from '@shared';

export enum AnswerCount {
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

export const SCORING_DEFAULTS = {
  BASE_POINTS: 100,
  STREAK: 0,
  DIFFICULTY: 'easy' as const,
  ANSWER_COUNT: 4,
  MAX_STREAK_BONUS: 10,
  STREAK_MULTIPLIER: 0.1,
  TIME_BONUS_MULTIPLIER: 0.5,
} as const;
