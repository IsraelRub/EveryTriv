/**
 * Server Shared Modules Index
 *
 * @module ServerSharedModules
 * @description Central export point for all server-side shared modules
 * @used_by server/features, server/controllers, server/services
 */

/**
 * Authentication shared module
 * @description Shared authentication functionality
 * @used_by server/features/auth, server/middleware
 */
export { AuthSharedModule } from './auth/auth.module';

/**
 * Cache module
 * @description Caching functionality
 * @used_by server/features, server/controllers
 */
export { CacheModule } from './cache/cache.module';

/**
 * Storage module
 * @description Storage functionality
 * @used_by server/features, server/controllers
 */
export { StorageModule } from './storage/storage.module';

/**
 * Logging module and service
 * @description Centralized logging functionality
 * @used_by server/features, server/controllers, server/services
 */
export { LoggerService } from '../controllers';
