/**
 * Core constants index for EveryTriv
 *
 * @module CoreConstants
 * @description Central export point for all core application constants
 * @used_by client/src/constants, server/src/internal/constants
 */

/**
 * API constants
 * @description API endpoints, HTTP status codes, and request configuration
 */
export * from './api.constants';

/**
 * Validation constants
 * @description Data validation rules, thresholds, and configuration
 */
export * from './validation.constants';

/**
 * Error constants
 * @description Error codes, messages, and error handling
 */
export * from './error.constants';

/**
 * Authentication constants
 * @description Authentication configuration, JWT settings, and auth headers
 */
export * from './auth.constants';

/**
 * Time constants
 * @description Time conversion constants in milliseconds
 */
export * from './time.constants';
