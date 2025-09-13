/**
 * Common Module Index
 *
 * @module Common
 * @description Central export point for all common module components
 * @used_by server/features, server/controllers, server/app
 */

/**
 * Enhanced decorators
 * @description Organized decorators for enhanced controller and repository functionality
 * @used_by server/features, server/controllers, server/repositories
 */
export * from './decorators';

/**
 * Interceptors
 * @description Interceptors for caching, logging, response formatting, and repository operations
 * @used_by server/features, server/controllers, server/app, server/repositories
 */
export * from './interceptors';

/**
 * Validation utilities
 * @description Validation middleware, decorators, and services
 * @used_by server/features, server/controllers
 */
export * from './validation';

/**
 * Custom pipes
 * @description Custom pipes for specialized validation and data transformation
 * @used_by server/features, server/controllers
 */
export * from './pipes';

/**
 * Global exception filter
 * @description Global exception handling and error responses
 * @used_by server/app, server/features
 */
export * from './globalException.filter';

/**
 * Authentication services
 * @description Centralized authentication, JWT, and password management
 * @used_by server/features, server/controllers, server/guards
 */
export * from './auth';

/**
 * Guards
 * @description Authentication and authorization guards
 * @used_by server/features, server/controllers
 */
export * from './guards';
