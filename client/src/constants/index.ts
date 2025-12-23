/**
 * Client Constants Index - Reorganized Structure
 *
 * @module ClientConstants
 * @description Central export point for all client-side constants and configuration
 */

/**
 * Core constants
 * @description UI constants and core configuration
 */
export * from './core';

/**
 * Domain constants
 * @description Domain-specific constants (game, user)
 */
export * from './domain';

/**
 * Infrastructure constants
 * @description Infrastructure constants (storage, audio, services)
 */
export * from './infrastructure';

// Export CLIENT_STORAGE_KEYS alias for backward compatibility
export { STORAGE_KEYS as CLIENT_STORAGE_KEYS } from './infrastructure/storage.constants';
