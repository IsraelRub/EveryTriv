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
 * Calculate duration in milliseconds from a start timestamp
 * @param startTime Start time in milliseconds (from Date.now())
 * @returns Duration in milliseconds
 * @description Calculates the difference between current time and start time in milliseconds
 * @example calculateDuration(Date.now() - 150) => 150
 */
export function calculateDuration(startTime: number): number {
	return Date.now() - startTime;
}

