/**
 * Server Middleware Index
 *
 * @module ServerMiddleware
 * @description Central export point for all server-side middleware
 * @used_by server/controllers, server/app, server/features
 */

/**
 * Authentication middleware
 * @description Middleware for user authentication and authorization
 * @used_by server/controllers, server/features/auth
 */
export * from './auth.middleware';

/**
 * Body validation middleware
 * @description Middleware for request body validation
 * @used_by server/controllers, server/features
 */
export * from './bodyValidation.middleware';

/**
 * Country check middleware
 * @description Middleware for geographic access control
 * @used_by server/controllers, server/features
 */
export * from './country-check.middleware';

/**
 * Logging middleware
 * @description Middleware for request/response logging
 * @used_by server/app, server/controllers
 */
export * from './logging.middleware';

/**
 * Rate limiting middleware
 * @description Middleware for API rate limiting
 * @used_by server/app, server/controllers
 */
export * from './rateLimit.middleware';

/**
 * Role check middleware
 * @description Middleware for user role verification
 * @used_by server/controllers, server/features
 */
export * from './roleCheck.middleware';
