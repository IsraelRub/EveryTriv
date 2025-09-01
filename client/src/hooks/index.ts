/**
 * Client Hooks Index
 *
 * @module ClientHooks
 * @description Central export point for all client-side React hooks and utilities
 * @version 1.0.0
 * @author EveryTriv Team
 * @used_by client/components, client/views, client/services
 */

/**
 * API integration hooks
 * @description Hooks for API communication, data fetching, and server interaction
 * @used_by client/components, client/views, client/services
 */
export * from './api';

/**
 * Context provider hooks
 * @description Hooks for React context providers and state management
 * @used_by client/components, client/views
 */
export * from './contexts';

/**
 * Layer hooks
 * @description Hooks organized by architectural layers and concerns
 * @used_by client/components, client/views, client/services
 */
export * from './layers';
