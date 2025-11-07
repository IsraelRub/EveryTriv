/**
 * Server Shared Modules Index
 *
 * @module ServerSharedModules
 * @description Central export point for all server-side shared modules
 * @used_by server/src/features, server/src/controllers, server/services
 */

/**
 * Caching module
 * @description Caching functionality
 * @used_by server/src/features, server/src/controllers
 */
export * from './cache';

/**
 * Persistent storage module
 * @description Persistent storage functionality
 * @used_by server/src/features, server/src/controllers
 */
export * from './storage';

/**
 * Redis module
 * @description Redis connection and configuration
 * @used_by server/src/features, server/src/controllers
 */
export { RedisModule } from './redis.module';
