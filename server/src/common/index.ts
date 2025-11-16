/**
 * Common Module Index
 *
 * @module Common
 * @description Central export point for all common module components
 * @used_by server/src/features, server/src/controllers, server/src/app
 */

/**
 * Enhanced decorators
 * @description Organized decorators for enhanced controller and repository functionality
 * @used_by server/src/features, server/src/controllers, server/src/repositories
 */
export * from './decorators';

/**
 * Interceptors
 * @description Interceptors for caching, logging, response formatting, and repository operations
 * @used_by server/src/features, server/src/controllers, server/src/app, server/src/repositories
 */
export * from './interceptors';

/**
 * Validation utilities
 * @description Validation middleware, decorators, and services
 * @used_by server/src/features, server/src/controllers
 */
export * from './validation';

/**
 * Custom pipes
 * @description Custom pipes for specialized validation and data transformation
 * @used_by server/src/features, server/src/controllers
 */
export * from './pipes';

/**
 * Global exception filter
 * @description Global exception handling and error responses
 * @used_by server/src/app, server/src/features
 */
export * from './globalException.filter';

/**
 * Authentication services
 * @description Centralized authentication, JWT, and password management
 * @used_by server/src/features, server/src/controllers, server/guards
 */
export * from './auth';

/**
 * Guards
 * @description Authentication and authorization guards
 * @used_by server/src/features, server/src/controllers
 */
export * from './guards';

/**
 * Query helpers
 * @description Helper functions for common TypeORM query patterns
 * @used_by server/src/features
 */
export * from './queries';
