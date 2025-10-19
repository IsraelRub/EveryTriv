/**
 * Constants index for EveryTriv - Reorganized Structure
 *
 * @module ConstantsIndex
 * @description Centralized export of all application constants organized by domain
 * @author EveryTriv Team
 * @used_by server/src/features, client/src/constants
 */

// ============================================================================
// CORE CONSTANTS
// ============================================================================

/**
 * Core constants
 * @description API, game, validation, and error constants
 */
export * from './core';

// ============================================================================
// INFRASTRUCTURE CONSTANTS
// ============================================================================

/**
 * Infrastructure constants
 * @description HTTP, storage, logging, and infrastructure configuration
 */
export * from './infrastructure';

// ============================================================================
// BUSINESS CONSTANTS
// ============================================================================

/**
 * Business constants
 * @description Payment, social, language, and info constants
 */
export * from './business';

// ============================================================================
// NAVIGATION CONSTANTS
// ============================================================================

/**
 * Navigation constants
 * @description Navigation links, routes, and configuration
 */
export * from './navigation';

// ============================================================================
// UTILITY CONSTANTS
// ============================================================================

/**
 * Utility constants
 * @description Constants from utility functions that should be in constants
 */
export { DEFAULT_USER_PREFERENCES } from '../utils/preferences.utils';
export { isCustomDifficulty } from '../validation/difficulty.validation';
