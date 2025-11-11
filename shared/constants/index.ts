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
 * @description API, validation, and error constants
 */
export * from './core';

// ============================================================================
// DOMAIN CONSTANTS
// ============================================================================

/**
 * Domain constants
 * @description Game, user, payment, and points constants
 */
export * from './domain';

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
