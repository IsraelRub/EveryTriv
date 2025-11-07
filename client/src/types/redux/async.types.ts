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

/**
 * Loading action payload
 */
export interface LoadingPayload {
	isLoading: boolean;
}

/**
 * Error action payload
 */
export interface ErrorPayload {
	error: string;
}
