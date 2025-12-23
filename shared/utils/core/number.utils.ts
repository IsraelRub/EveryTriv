/**
 * Number Utilities
 *
 * @module NumberUtils
 * @description Utility functions for number calculations and time conversions shared between client and server
 * @used_by client/src/components, client/src/views, server/src/features
 */

/**
 * Get current timestamp in seconds
 * @returns Current timestamp in seconds (Unix timestamp)
 * @description Converts Date.now() milliseconds to seconds using Math.floor
 * @example getCurrentTimestampInSeconds() => 1704067200
 */
export function getCurrentTimestampInSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

/**
 * Calculate elapsed time in seconds from a start timestamp
 * @param startTime Start time in milliseconds (from Date.now())
 * @returns Elapsed time in seconds
 * @description Calculates the difference between current time and start time in seconds
 * @example calculateElapsedSeconds(Date.now() - 5000) => 5
 */
export function calculateElapsedSeconds(startTime: number): number {
	return Math.floor((Date.now() - startTime) / 1000);
}

/**
 * Round number for display purposes
 * @param value Number to round
 * @param decimals Number of decimal places (default: 2)
 * @returns Rounded number
 * @description Rounds a number to specified decimal places and returns as number
 * @example roundForDisplay(3.14159) => 3.14
 * @example roundForDisplay(3.14159, 1) => 3.1
 */
export function roundForDisplay(value: number, decimals: number = 2): number {
	if (isNaN(value) || !isFinite(value)) {
		return 0;
	}
	return Number(value.toFixed(decimals));
}
