/**
 * Server Constants Index - Reorganized Structure
 *
 * @module ServerConstants
 * @description Central export point for all server-side constants and configuration
 * @author EveryTriv Team
 * @used_by server/src/features, server/src/controllers, server/src/services
 */

// ============================================================================
// DATABASE CONSTANTS
// ============================================================================

/**
 * Database constants
 * @description Database tables, Redis configuration, and connection settings
 */
export * from './database';

// ============================================================================
// POINTS CONSTANTS
// ============================================================================

/**
 * Points constants
 * @description Points management, transaction types, and pricing
 */
export * from './points';

// ============================================================================
// APP CONSTANTS
// ============================================================================

/**
 * App constants
 * @description Server-specific application constants and configuration
 */
export * from './app';

// ============================================================================
// SHARED CONSTANTS RE-EXPORTS
// ============================================================================

/**
 * Shared constants
 * @description General application configuration constants
 */
// export * from '@shared'; // Commented out for TypeORM CLI compatibility
