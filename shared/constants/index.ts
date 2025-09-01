/**
 * Constants index for EveryTriv
 *
 * @module ConstantsIndex
 * @description Centralized export of all application constants organized by category
 * @version 1.0.0
 * @author EveryTriv Team
 * @used_by server: server/src/shared/constants, client: client/src/shared/constants
 */

/**
 * API constants
 * @description API endpoints, HTTP status codes, and request configuration
 * @exports {Object} API-related constants
 */
export * from './api.constants';

/**
 * Game constants
 * @description Game mechanics, difficulty levels, scoring, and game modes
 * @exports {Object} Game-related constants
 */
export * from './game.constants';

/**
 * HTTP constants
 * @description HTTP status codes, methods, and headers
 * @exports {Object} HTTP-related constants
 */
export * from './http.constants';

/**
 * Info constants
 * @description Application information, metadata, and branding
 * @exports {Object} Application info constants
 */
export * from './info.constants';

/**
 * Infrastructure constants
 * @description Server ports, URLs, and infrastructure configuration
 * @exports {Object} Infrastructure configuration constants
 */
export * from './infrastructure.constants';

/**
 * Language constants
 * @description Language detection, validation, and localization
 * @exports {Object} Language-related constants
 */
export * from './language.constants';

/**
 * Logging constants
 * @description Logging levels, formats, and configuration
 * @exports {Object} Logging configuration constants
 */
export * from './logging.constants';

/**
 * Payment constants
 * @description Payment processing, currencies, and billing
 * @exports {Object} Payment-related constants
 */
export * from './payment.constants';

/**
 * Social constants
 * @description Social media, sharing, and community features
 * @exports {Object} Social media constants
 */
export * from './social.constants';

/**
 * Tech constants
 * @description Technology stack, versions, and technical configuration
 * @exports {Object} Technical configuration constants
 */
export * from './tech.constants';

/**
 * Validation constants
 * @description Data validation rules, thresholds, and configuration
 * @exports {Object} Validation configuration constants
 */
export * from './validation.constants';

/**
 * Error constants
 * @description Error codes, messages, and error handling
 * @exports {Object} Error-related constants
 */
export * from './error.constants';

/**
 * Navigation constants
 * @description Routing, navigation, and URL configuration
 * @exports {Object} Navigation-related constants
 */
export * from './navigation.constants';

/**
 * Storage constants
 * @description Storage configuration, limits, and settings
 * @exports {Object} Storage configuration constants
 */
export * from './storage.constants';
