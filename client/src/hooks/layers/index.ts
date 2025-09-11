/**
 * Layer Hooks Index
 *
 * @module LayerHooks
 * @description Hooks organized by architectural layers
 * @used_by client/components, client/views, client/hooks
 */

/**
 * Audio layer hooks
 * @description Hooks for audio and sound management
 * @used_by client/components/audio, client/components/game
 */


/**
 * Business layer hooks
 * @description Business logic moved to Redux slices and services
 * @used_by client/components/game, client/views
 */

/**
 * UI layer hooks
 * @description Hooks for UI optimization and animations
 * @used_by client/components, client/views
 */
// UI layer hooks removed - functionality moved to components

/**
 * Utils layer hooks
 * @description General utility hooks for common functionality
 * @used_by client/components, client/views, client/services
 */
export * from './utils';
