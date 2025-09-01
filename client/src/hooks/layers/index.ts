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
export * from './audio';

/**
 * Business layer hooks
 * @description Hooks for game logic and business rules
 * @used_by client/components/game, client/views
 */
export * from './business';

/**
 * UI layer hooks
 * @description Hooks for UI optimization and animations
 * @used_by client/components, client/views
 */
export * from './ui';

/**
 * Utils layer hooks
 * @description General utility hooks for common functionality
 * @used_by client/components, client/views, client/services
 */
export * from './utils';
