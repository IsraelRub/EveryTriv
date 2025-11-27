/**
 * Shared Types Index
 *
 * @module SharedTypes
 * @description Central export point for all shared TypeScript types and interfaces
 * @author EveryTriv Team
 * @used_by client/src/types, server/src/features
 */

// =============================================================================
// CORE TYPES - Basic data structures, utilities, errors, and responses
// =============================================================================

/**
 * Core type definitions
 * @description Core type definitions used across the application
 */
export * from './core';

// =============================================================================
// DOMAIN TYPES - Business logic and domain-specific types
// =============================================================================

/**
 * Domain Types
 * @description Business logic and domain-specific types
 */
export * from './domain';

// =============================================================================
// INFRASTRUCTURE TYPES - Technical and infrastructure-related types
// =============================================================================

/**
 * Infrastructure Types
 * @description Technical types for API, auth, cache, config, HTTP, logging, Redis, and storage
 */
export * from './infrastructure';

// =============================================================================
// SPECIALIZED TYPES - Specific feature and utility types
// =============================================================================

/**
 * Language types
 * @description Types for language detection, validation, and tool integration
 */
export * from './language.types';

/**
 * Credits types
 * @description Types for credits management, calculations, and balances
 */
export * from './credits.types';

/**
 * Subscription types
 * @description Types for subscription management, plans, and data
 */
export * from './subscription.types';

/**
 * Payment types
 * @description Types for payment processing and data
 */
export * from './payment.types';
