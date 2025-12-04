/**
 * Analytics Utilities
 *
 * @module AnalyticsUtils
 * @description Client-side analytics calculation utilities for local data processing
 * @used_by client/src/services, client/src/views
 */

/**
 * Calculate average from array of numbers
 * @param values Array of numbers
 * @param decimals Number of decimal places (default: 0)
 * @returns Average value
 */
export function calculateAverage(values: number[], decimals: number = 0): number {
	if (values.length === 0) return 0;

	const sum = values.reduce((acc, val) => acc + val, 0);
	const avg = sum / values.length;

	if (decimals === 0) {
		return Math.round(avg);
	}

	return Number(avg.toFixed(decimals));
}

/**
 * Format play time from seconds or minutes to human-readable format
 * @param time Time in seconds or minutes
 * @param unit Unit of time: 'seconds' or 'minutes' (default: 'seconds')
 * @returns Formatted time string (e.g., "2h 30m" or "45m")
 */
export function formatPlayTime(time: number, unit: 'seconds' | 'minutes' = 'seconds'): string {
	const totalSeconds = unit === 'seconds' ? time : time * 60;
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);

	if (hours > 0) {
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	}
	return `${minutes}m`;
}

/**
 * Calculate grade (stars) based on percentage
 * @param percentage Percentage score (0-100)
 * @returns Grade object with stars (0-3) and color class
 */
export function calculateGrade(percentage: number): { stars: number; color: string } {
	if (percentage >= 90) return { stars: 3, color: 'text-green-500' };
	if (percentage >= 80) return { stars: 2, color: 'text-blue-500' };
	if (percentage >= 70) return { stars: 1, color: 'text-yellow-500' };
	return { stars: 0, color: 'text-red-500' };
}
