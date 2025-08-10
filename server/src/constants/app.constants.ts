// Import shared constants
import {
  VALID_DIFFICULTIES,
  CUSTOM_DIFFICULTY_PREFIX,
  QUEUE_CONFIG,
  PRIORITIES
} from '../../../shared/constants/game.constants';

// Re-export shared constants for backward compatibility
export const DIFFICULTIES = VALID_DIFFICULTIES;
export { CUSTOM_DIFFICULTY_PREFIX, QUEUE_CONFIG, PRIORITIES };

// Server-specific constants
export const APP_CONSTANTS = {
  API_VERSION: "v1",
  CACHE_TTL: 3600,
  MAX_RETRIES: 3,
  DEFAULT_TIMEOUT: 30000,
  PROCESSING_TIMEOUT: 30000,
  DEFAULT_PAGE_SIZE: 10,
  RATE_LIMIT: {
    windowMs: 60000,
    max: 100,
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
} as const;