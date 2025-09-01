/**
 * Client Services Index
 *
 * @module ClientServices
 * @description Central export point for all client-side services and utilities
 * @version 1.0.0
 * @author EveryTriv Team
 * @used_by client/components, client/views, client/hooks
 */

/**
 * API services
 * @description Core API communication services and HTTP client utilities
 * @used_by client/components, client/views, client/hooks
 */
export * from './api';

/**
 * Auth services
 * @description Authentication, authorization, and user management services
 * @used_by client/components, client/views, client/hooks
 */
export * from './auth';

/**
 * Game services
 * @description Game-related services, utilities, and game state management
 * @used_by client/components/game, client/views
 */
export * from './game';

/**
 * Media services
 * @description Audio, media management, and multimedia services
 * @used_by client/components/audio, client/views
 */
export * from './media';

/**
 * Storage services
 * @description Local storage, data persistence, and cache management services
 * @used_by client/components, client/views, client/hooks
 */
export * from './storage';

/**
 * Utils services
 * @description Utility services for common functionality and helper operations
 * @used_by client/components, client/views, client/hooks
 */
export * from './utils';
