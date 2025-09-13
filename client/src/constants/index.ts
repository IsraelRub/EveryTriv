/**
 * Client Constants Index - Reorganized Structure
 *
 * @module ClientConstants
 * @description Central export point for all client-side constants and configuration
 * @author EveryTriv Team
 * @used_by client/components, client/services, client/hooks
 */

// ============================================================================
// UI CONSTANTS
// ============================================================================

/**
 * UI constants
 * @description Theme configuration, styling constants, and UI-related settings
 */
export * from './ui';

// ============================================================================
// AUDIO CONSTANTS
// ============================================================================

/**
 * Audio constants
 * @description Audio settings, sound effects, and audio management configuration
 */
export * from './audio';

// ============================================================================
// GAME CONSTANTS
// ============================================================================

/**
 * Game constants
 * @description Game logic, rules, and gameplay configuration constants
 */
export * from './game';

// ============================================================================
// APP CONSTANTS
// ============================================================================

/**
 * App constants
 * @description Core application configuration constants
 */
export * from './app';

// ============================================================================
// USER CONSTANTS
// ============================================================================

/**
 * User constants
 * @description User-related constants, default values, and user configuration
 */
export * from './user';

// ============================================================================
// SHARED CONSTANTS RE-EXPORTS
// ============================================================================

/**
 * Navigation constants
 * @description Routing paths, navigation links, and navigation configuration
 */
export {
  NAVIGATION_CONFIG,
  NAVIGATION_LINKS,
  ROUTE_PATHS,
} from '@shared/constants/navigation/navigation.constants';

/**
 * Storage constants
 * @description Local storage keys, cache configuration, and storage settings
 */
export { STORAGE_KEYS as CLIENT_STORAGE_KEYS } from './storage/storage.constants';
export {
  CACHE_TTL,
  STORAGE_CONFIG,
  STORAGE_KEYS,
} from '@shared/constants/infrastructure/storage.constants';
