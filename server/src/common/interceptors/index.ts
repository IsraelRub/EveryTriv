/**
 * Common Interceptors Index
 *
 * @module CommonInterceptors
 * @description Central export point for all common interceptors
 * @used_by server/features, server/controllers, server/app, server/repositories
 */

/**
 * Cache interceptor
 * @description Interceptor for implementing caching based on @Cache decorator
 * @used_by server/features, server/controllers
 */
export * from './cache.interceptor';

/**
 * Response formatting interceptor
 * @description Interceptor for standardizing API response format
 * @used_by server/app, server/controllers
 */
export * from './response-formatting.interceptor';

/**
 * Performance monitoring interceptor
 * @description Interceptor for tracking request performance metrics
 * @used_by server/app, server/controllers
 */
export * from './performance-monitoring.interceptor';

/**
 * Repository interceptor
 * @description Interceptor that handles repository method decorators and caching
 * @used_by server/repositories
 */
export * from './repository.interceptor';
