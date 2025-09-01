/**
 * Server Shared Resources Index
 *
 * @module ServerShared
 * @description Central export point for all server-side shared resources and modules
 * @version 1.0.0
 * @author EveryTriv Team
 * @used_by server/features, server/controllers, server/app
 */

/**
 * Middleware
 * @description Shared middleware for request processing, validation, and error handling
 * @exports {Object} Middleware implementations
 * @used_by server/app, server/controllers
 */
export * from './middleware';

/**
 * Authentication
 * @description Shared authentication guards, strategies, and security modules
 * @exports {Object} Authentication-related modules and guards
 * @used_by server/features, server/controllers
 */
export * from './modules/auth';

/**
 * Shared modules
 * @description Logger service and other core shared modules
 * @exports {LoggerService} Core logging service
 * @used_by server/features, server/app
 */
export { LoggerService } from './modules';

/**
 * Repositories
 * @description Shared repository classes for database access and data operations
 * @exports {Object} Repository implementations
 * @used_by server/features, server/services
 */
export * from './repositories';

/**
 * Utility functions
 * @description Shared utility functions, helpers, and common operations
 * @exports {Object} Utility function implementations
 * @used_by server/features, server/services
 */
export * from './utils';
