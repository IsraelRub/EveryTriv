/**
 * Client Hooks Index
 *
 * @module ClientHooks
 * @description Central export point for all client-side React hooks and utilities
 * @author EveryTriv Team
 * @used_by client/src/components, client/src/views, client/src/services
 */

/**
 * API integration hooks
 * @description Hooks for API communication, data fetching, and server interaction
 * @used_by client/src/components, client/src/views, client/src/services
 */
export * from './api';

/**
 * Layer hooks
 * @description Hooks organized by architectural layers and concerns
 * @used_by client/src/components, client/src/views, client/src/services
 */
export * from './layers';
