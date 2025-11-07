/**
 * Client-side date utilities
 *
 * @module ClientDateUtils
 * @description Date manipulation and formatting utilities for client-side use
 * @used_by client/src/components, client/src/views
 */

/**
 * Check if date is today
 * @param date Date to check
 * @returns True if date is today
 */
export function isToday(date: Date): boolean {
	const today = new Date();
	return date.toDateString() === today.toDateString();
}

/**
 * Check if date is yesterday
 * @param date Date to check
 * @returns True if date is yesterday
 */
export function isYesterday(date: Date): boolean {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	return date.toDateString() === yesterday.toDateString();
}

/**
 * Get current timestamp
 * @returns Current timestamp in milliseconds
 */
export function getCurrentTimestamp(): number {
	return Date.now();
}
