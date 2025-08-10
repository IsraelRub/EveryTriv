/**
 * Trivia-specific constants (now using shared constants)
 */

// Import shared constants
import {
  VALID_DIFFICULTIES,
  CUSTOM_DIFFICULTY_PREFIX,
  QUEUE_CONFIG,
  PRIORITIES
} from '../../../../../shared/constants/game.constants';

// Re-export shared constants for backward compatibility
export const DIFFICULTIES = VALID_DIFFICULTIES;
export { CUSTOM_DIFFICULTY_PREFIX, PRIORITIES };

// Trivia-specific constants
export const TRIVIA_CONSTANTS = {
  DIFFICULTIES,
  CUSTOM_DIFFICULTY_PREFIX,
  QUEUE: QUEUE_CONFIG,
  PRIORITIES,
} as const;
