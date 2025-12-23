/**
 * Type Guards Utilities (server-only)
 *
 * @module TypeGuardsUtils
 * @description Type guard functions for runtime type checking
 * @used_by server/src
 */

/**
 * Type guard for error with status/statusCode properties
 * @param error Error to check
 * @returns True if error has status or statusCode properties
 */
export function isErrorWithStatus(error: unknown): error is { status?: number; statusCode?: number } {
	if (typeof error !== 'object' || error === null) {
		return false;
	}
	return (
		('status' in error &&
			(error.status === undefined || (typeof error.status === 'number' && Number.isFinite(error.status)))) ||
		('statusCode' in error &&
			(error.statusCode === undefined || (typeof error.statusCode === 'number' && Number.isFinite(error.statusCode))))
	);
}

/**
 * Type guard for string values
 * @param value Value to check
 * @returns True if value is a string
 */
export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

/**
 * Type guard for number values (finite numbers only)
 * @param value Value to check
 * @returns True if value is a finite number
 */
export function isNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Type guard for boolean values
 * @param value Value to check
 * @returns True if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
	return typeof value === 'boolean';
}
