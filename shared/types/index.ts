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
// Language validation types are now exported from domain/validation.types.ts
