/**
 * Client Validation Types
 * @module ClientValidationTypes
 * @description Client-side validation type definitions
 */

/**
 * Validation hook options interface
 * @interface ValidationHookOptions
 * @description Options for client-side validation hooks
 */
export interface ValidationHookOptions {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	customValidator?: (value: string) => boolean;
	errorMessage?: string;
}
