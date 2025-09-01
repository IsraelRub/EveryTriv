/**
 * Client Constants Index
 *
 * @module ClientConstants
 * @description Central export point for all client-side constants and configuration
 * @version 1.0.0
 * @author EveryTriv Team
 * @used_by client/components, client/services, client/hooks
 */

/**
 * API configuration constants
 * @description API endpoints, request configuration, and service settings
 * @exports {Object} API-related configuration constants
 * @used_by client/services, client/hooks
 */
export * from './api.constants';

/**
 * Application constants
 * @description Core application configuration, settings, and defaults
 * @exports {Object} Application-wide configuration constants
 * @used_by client/components, client/services
 */
export * from './app.constants';

/**
 * Audio configuration constants
 * @description Audio settings, sound effects, and audio management configuration
 * @exports {Object} Audio-related configuration constants
 * @used_by client/components/audio, client/services/audio
 */
export * from './audio.constants';

/**
 * Navigation constants
 * @description Routing paths, navigation links, and navigation configuration
 * @exports {Object} Navigation-related constants
 * @used_by client/components/navigation, client/components/layout
 */
export { NAVIGATION_CONFIG,NAVIGATION_LINKS, ROUTE_PATHS } from 'everytriv-shared/constants/navigation.constants';

/**
 * Storage constants
 * @description Local storage keys, cache configuration, and storage settings
 * @exports {Object} Storage-related configuration constants
 * @used_by client/services, client/hooks, client/utils
 */
export { CACHE_TTL,STORAGE_CONFIG, STORAGE_KEYS } from 'everytriv-shared/constants/storage.constants';

/**
 * UI constants
 * @description Theme configuration, styling constants, and UI-related settings
 * @exports {Object} UI-related configuration constants
 * @used_by client/components, client/hooks, client/services
 */
export * from './ui.constants';

/**
 * Form field constants
 * @description Predefined form field configurations and validation settings
 * @exports {Object} Form field configuration constants
 * @used_by client/views/registration, client/components/forms
 */
export * from './form.constants';

/**
 * Game state constants
 * @description Default game state values and state management configuration
 * @exports {Object} Game state configuration constants
 * @used_by client/views/home, client/components/game
 */
export * from './game-state.constants';

/**
 * Game configuration constants
 * @description Game logic, rules, and gameplay configuration constants
 * @exports {Object} Game configuration constants
 * @used_by client/components/game, client/hooks
 */
export * from './game.constants';

/**
 * Validation constants
 * @description Constants for form validation and error messages
 * @used_by client/components, client/services
 */
// Validation constants moved to validation module
// export * from './validation.constants';
