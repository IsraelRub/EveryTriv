/**
 * Shared Services Index
 *
 * @module SharedServices
 * @description Central export point for all shared services including logging and storage
 * @author EveryTriv Team
 */

/**
 * Storage services
 * @description Storage management services for local and remote data
 * @exports {Object} Storage service implementations
 * @used_by client/src/services, server/src/services
 */
export * from './storage';

/**
 * Logging services
 * @description Complete logging system for client and server
 * @exports {Object} All logging services and utilities
 * @used_by client/src/services, server/src/services
 */
export * from './logging';

/**
 * Points services
 * @description Points management and calculation services
 * @exports {Object} All points-related services and utilities
 * @used_by client/src/services, server/src/services
 */
export * from './points';

/**
 * Auth services
 * @description Authentication and authorization services
 * @exports {Object} All auth-related services and utilities
 * @used_by client/src/services, server/src/services
 */
export * from './auth';

/**
 * Cache services
 * @description caching services
 * @exports {Object} All cache-related services and utilities
 * @used_by client/src/services, server/src/services
 */
export * from './cache';
