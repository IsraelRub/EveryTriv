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
 * AI Domain Types
 * @description AI-related type definitions including providers, models, and responses
 */
export * from './domain/ai';

/**
 * Analytics Domain Types
 * @description Analytics and metrics type definitions (excluding conflicting types)
 */
export * from './domain/analytics';

/**
 * Game Domain Types
 * @description Game-related type definitions including trivia, sessions, and configuration (excluding conflicting types)
 */
export * from './domain/game';

/**
 * User Domain Types
 * @description User-related type definitions including profiles, preferences, and addresses
 */
export * from './domain/user';

/**
 * Validation Domain Types
 * @description Validation-related type definitions including forms, rules, and validation results
 */
export * from './domain/validation';

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
 * Points types
 * @description Types for points management, calculations, and balances
 */
export * from './points.types';

/**
 * Subscription types
 * @description Types for subscription management, plans, and data
 */
export * from './subscription.types';

/**
 * UI types
 * @description Types for user interface components, forms, and validation
 */
export * from './ui.types';

/**
 * Payment types
 * @description Types for payment processing and data
 */
export * from './payment.types';

