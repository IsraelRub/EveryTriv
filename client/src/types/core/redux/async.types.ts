/**
 * Async Types
 * @module AsyncTypes
 * @description Async operation types for Redux
 */

/**
 * Base state interface for all Redux slices
 */
export interface BaseReduxState {
	isLoading: boolean;
	error: string | null;
}
