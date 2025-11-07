/**
 * Server Middleware Index
 *
 * @module ServerMiddleware
 * @description Central export point for all server-side middleware
 * @used_by server/src/controllers, server/src/app, server/src/features
 */

/**
 * Country check middleware
 * @description Middleware for geographic access control
 * @used_by server/controllers, server/features
 */
export * from './country-check.middleware';

/**
 * Logging middleware
 * @description Middleware for request/response logging
 * @used_by server/src/app, server/controllers
 */

/**
 * Rate limiting middleware
 * @description Middleware for API rate limiting
 * @used_by server/src/app, server/controllers
 */
export * from './rateLimit.middleware';

/**
 * Decorator-aware middleware
 * @description Middleware that reads decorator metadata
 * @used_by server/src/app, server/controllers
 */
export * from './decorator-aware.middleware';

/**
 * Bulk operations middleware
 * @description Middleware for optimizing bulk operations and batching
 * @used_by server/src/app, server/controllers
 */
export * from './bulkOperations.middleware';
