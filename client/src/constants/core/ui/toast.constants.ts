/**
 * Toast Constants
 * @module ToastConstants
 * @description Constants for toast notification system
 */

/**
 * Maximum number of toasts to display
 */
export const TOAST_LIMIT = 3;

/**
 * Delay after dismiss animation before removing toast from DOM (in milliseconds)
 */
export const TOAST_REMOVE_DELAY = 300;

/**
 * Default duration for auto-dismissing toasts (in milliseconds)
 */
export const DEFAULT_TOAST_DURATION = 5000;

/**
 * Toast action type enum
 * @enum {string} ToastActionType
 * @description Action types for toast reducer
 */
export enum ToastActionType {
	ADD_TOAST = 'ADD_TOAST',
	UPDATE_TOAST = 'UPDATE_TOAST',
	DISMISS_TOAST = 'DISMISS_TOAST',
	REMOVE_TOAST = 'REMOVE_TOAST',
}
