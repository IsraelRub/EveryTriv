/**
 * Client Types Index
 *
 * @module ClientTypes
 * @description Central export file for all client-side TypeScript types and interfaces
 */

/**
 * Game types
 * @description Game state, configuration, and component props
 */
export * from './game';

/**
 * UI types
 * @description UI component types and prop types
 */
export * from './ui';

/**
 * Redux types
 * @description Redux state management, async operations, and action types
 */
export * from './redux';

/**
 * API types
 * @description API service interfaces and response types
 */
export * from './api.types';

/**
 * Interceptor types
 * @description HTTP request/response interceptor types and configurations
 */
export * from './interceptors.types';

/**
 * User types
 * @description User profiles, authentication, and preferences
 * @exports {Object} User-related type definitions
 */
export * from './user.types';

/**
 * Route types
 * @description Route-related types and interfaces
 * @exports {Object} Route-related type definitions
 */
export * from './route.types';

/**
 * Routing types
 * @description Routing-related types and interfaces (modal routes, etc.)
 */
export * from './routing/modal.types';

/**
 * Validation types
 * @description Validation types and interfaces
 * @exports {Object} Validation-related type definitions
 */
export * from './validation.types';

/**
 * User component types
 * @description User component prop types and interfaces
 */
export * from './user/components.types';

/**
 * Hooks types
 * @description Hook-related types and interfaces
 */
export * from './hooks/toast.types';

/**
 * Services types
 * @description Service-related types and interfaces
 */
export * from './services/analytics.types';
export * from './services/logger.types';
export * from './services/storage.types';
