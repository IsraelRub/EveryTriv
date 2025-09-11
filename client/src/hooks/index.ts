/**
 * Client Hooks Index
 *
 * @module ClientHooks
 * @description Central export point for all client-side React hooks and utilities
 * @author EveryTriv Team
 * @used_by client/components, client/views, client/services
 */

/**
 * API integration hooks
 * @description Hooks for API communication, data fetching, and server interaction
 * @used_by client/components, client/views, client/services
 */
export * from './api';

// Context provider hooks removed - functionality moved to components

/**
 * Layer hooks
 * @description Hooks organized by architectural layers and concerns
 * @used_by client/components, client/views, client/services
 */
export * from './layers';

// UI Layer Hooks removed - functionality moved to components
