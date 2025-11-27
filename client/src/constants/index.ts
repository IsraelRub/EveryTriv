/**
 * Client Constants Index - Reorganized Structure
 *
 * @module ClientConstants
 * @description Central export point for all client-side constants and configuration
 */

/**
 * UI constants
 * @description Theme configuration, styling constants, and UI-related settings
 */
export * from './ui';

/**
 * Audio constants
 * @description Audio settings, sound effects, and audio management configuration
 */
export * from './audio.constants';

/**
 * Game constants
 * @description Game configuration and scoring constants
 */
export * from './game.constants';

/**
 * User constants
 * @description User-related constants, default values, and user configuration
 */
export * from './user-defaults.constants';

/**
 * Storage constants
 * @description Local storage keys, cache configuration, and storage settings
 */
export * from './storage.constants';

export { STORAGE_KEYS as CLIENT_STORAGE_KEYS } from './storage.constants';
