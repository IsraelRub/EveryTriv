/**
 * Utils Layer Hooks Index
 *
 * @module UtilsLayerHooks
 * @description Utility hooks for common functionality
 * @used_by client/components, client/src/views, client/src/hooks
 */


/**
 * Previous value hook
 * @description Hook for tracking previous values
 * @used_by client/components, client/src/views
 */
export { usePrevious } from './usePrevious';

/**
 * Redux hooks
 * @description Hooks for Redux store access
 * @used_by client/components, client/src/views
 */
export { useAppDispatch, useAppSelector } from './useRedux';

/**
 * Debounce hook
 * @description Hook for debouncing values and function calls
 * @used_by client/components, client/src/views
 */
export { useDebounce, useDebouncedCallback } from './useDebounce';

/**
 * Cache hook
 * @description Hook for client-side caching with server integration
 * @used_by client/components, client/src/views
 */
