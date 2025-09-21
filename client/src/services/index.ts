/**
 * Client Services Index
 *
 * @module ClientServices
 * @description Central export point for all client-side services and utilities
 * @author EveryTriv Team
 * @used_by client/src/components, client/src/views, client/src/hooks
 */

/**
 * API services
 * @description Core API communication services and HTTP client utilities
 * @used_by client/src/components, client/src/views, client/src/hooks
 */
export * from './api';

/**
 * Auth services
 * @description Authentication, authorization, and user management services
 * @used_by client/src/components, client/src/views, client/src/hooks
 */
export * from './auth';

/**
 * Game services
 * @description Game-related services, utilities, and game state management
 * @used_by client/src/components/game, client/src/views
 */
export * from './game';

/**
 * Media services
 * @description Audio, media management, and multimedia services
 * @used_by client/src/components/audio, client/src/views
 */
export * from './media';

/**
 * Storage services
 * @description Local storage, data persistence, and cache management services
 * @used_by client/src/components, client/src/views, client/src/hooks
 */
export * from './storage';

/**
 * Utils services
 * @description Utility services for common functionality and helper operations
 * @used_by client/src/components, client/src/views, client/src/hooks
 */
export * from './utils';
