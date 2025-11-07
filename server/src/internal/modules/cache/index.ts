/**
 * Cache Feature Index
 *
 * @module CacheFeature
 * @description Redis caching and data persistence feature module
 * @used_by server/app.module, server/features/game
 */

/**
 * Cache module and services
 * @description Redis caching and data management
 * @used_by server/app.module, server/services
 */
export { CacheModule } from './cache.module';
export { CacheService } from './cache.service';
