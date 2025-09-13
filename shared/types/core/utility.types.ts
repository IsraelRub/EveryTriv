/**
 * Utility Types
 *
 * @module UtilityTypes
 * @description Advanced TypeScript utility types for the application
 */

/**
 * Make specific fields required
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
