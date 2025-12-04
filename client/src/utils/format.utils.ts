/**
 * Client-side formatting utilities
 *
 * @module ClientFormatUtils
 * @description Data formatting and display utilities for client-side use
 * @used_by client/src/components, client/src/views
 */

/**
 * Format number with appropriate suffix (consolidated with formatScore)
 * @param num Number to format
 * @param decimals Number of decimal places (default: 1)
 * @param includeSuffix Whether to include K/M suffix (default: true)
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals: number = 1, includeSuffix: boolean = true): string {
	if (!includeSuffix) return num.toFixed(decimals);

	if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
	if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
	return num.toFixed(decimals);
}

/**
 * Format score with appropriate formatting
 * @param score Score to format
 * @param showPlus Whether to show plus sign for positive scores (default: true)
 * @returns Formatted score string
 */
export function formatScore(score: number, showPlus: boolean = true): string {
	const formatted = formatNumber(Math.abs(score), 1, true);
	return score >= 0 && showPlus ? `+${formatted}` : formatted;
}

/**
 * Format time in MM:SS format
 * @param totalSeconds Total seconds to format
 * @returns Formatted time string
 */
export function formatTime(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format time display with appropriate unit
 * @param seconds Time in seconds
 * @returns Formatted time string with unit
 */
export function formatTimeDisplay(seconds: number): string {
	if (seconds < 60) {
		return `${seconds}s`;
	} else if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		return `${minutes}m`;
	} else {
		const hours = Math.floor(seconds / 3600);
		return `${hours}h`;
	}
}

/**
 * Format time until reset (for daily limits, etc.)
 * @param resetTime Reset time timestamp
 * @returns Formatted time until reset string
 */
export function formatTimeUntilReset(resetTime: number): string {
	const now = Date.now();
	const timeUntilReset = resetTime - now;

	if (timeUntilReset <= 0) {
		return 'Reset now';
	}

	const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
	const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	} else {
		return `${minutes}m`;
	}
}
