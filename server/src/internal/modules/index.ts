/**
 * Server Shared Modules Index
 *
 * @module ServerSharedModules
 * @description Central export point for all server-side shared modules
 * @used_by server/src/features, server/src/controllers, server/services
 */

/**
 * Authentication shared module
 * @description Shared authentication functionality moved to features/auth
 * @used_by server/src/features/auth, server/middleware
 */

/**
 * Cache module
 * @description Caching functionality
 * @used_by server/src/features, server/src/controllers
 */
export { CacheModule } from './cache/cache.module';

/**
 * Storage module
 * @description Storage functionality
 * @used_by server/src/features, server/src/controllers
 */
export { StorageModule } from './storage/storage.module';

/**
 * Redis module
 * @description Redis connection and configuration
 * @used_by server/src/features, server/src/controllers
 */
export { RedisModule } from './redis.module';
