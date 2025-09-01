/**
 * Utils Layer Hooks Index
 *
 * @module UtilsLayerHooks
 * @description Utility hooks for common functionality
 * @used_by client/components, client/views, client/hooks
 */

/**
 * Async hook
 * @description Hook for handling async operations
 * @used_by client/components, client/views
 */
export { useAsync } from './useAsync';

/**
 * Local storage hook
 * @description Hook for managing local storage
 * @used_by client/components, client/views
 */
export { useLocalStorage } from './useLocalStorage';

/**
 * Previous value hook
 * @description Hook for tracking previous values
 * @used_by client/components, client/views
 */
export { usePrevious } from './usePrevious';

/**
 * Redux hooks
 * @description Hooks for Redux store access
 * @used_by client/components, client/views
 */
export { useAppDispatch, useAppSelector } from './useRedux';

/**
 * Throttle hook
 * @description Hook for throttling function calls
 * @used_by client/components, client/views
 */
export { useThrottle } from './useThrottle';

/**
 * Debounce hook
 * @description Hook for debouncing values and function calls
 * @used_by client/components, client/views
 */
export { useDebounce, useDebouncedCallback } from './useDebounce';
