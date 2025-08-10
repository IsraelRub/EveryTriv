/**
 * User feature constants (now using shared validation limits)
 */

// Import shared validation limits
import { VALIDATION_LIMITS } from '../../../../../shared/constants/game.constants';

// Re-export shared limits
export const PASSWORD_MIN_LENGTH = VALIDATION_LIMITS.PASSWORD.MIN_LENGTH;
export const USERNAME_MIN_LENGTH = VALIDATION_LIMITS.USERNAME.MIN_LENGTH;
export const USERNAME_MAX_LENGTH = VALIDATION_LIMITS.USERNAME.MAX_LENGTH;

// User-specific constants
export const USER_CONSTANTS = {
  PASSWORD_MIN_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  DEFAULT_AVATAR: 'default-avatar.png',
};
