/**
 * Shared Services Index
 *
 * @module SharedServices
 * @description Central export point for all shared services including logging and storage
 * @version 1.0.0
 * @author EveryTriv Team
 */

/**
 * Logging services
 * @description Comprehensive logging system with multiple logger types
 * @exports {Object} Logger implementations for different contexts
 * @used_by client/services, server/services
 */
export * from './logging';

/**
 * Storage services
 * @description Storage management services for local and remote data
 * @exports {Object} Storage service implementations
 * @used_by client/services, server/services
 */
export * from './storage';
