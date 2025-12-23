/**
 * Client-side formatting utilities
 *
 * @module ClientFormatUtils
 * @description Data formatting and display utilities for client-side use
 * @used_by client/src/components, client/src/views
 */

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

/**
 * Format date to readable string
 * @param date Date object or date string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(date: Date | string): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	return dateObj.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

/**
 * Format duration in seconds to readable string
 * @param seconds Duration in seconds
 * @returns Formatted duration string (e.g., "5m 30s" or "30s")
 */
export function formatDuration(seconds: number): string {
	if (!seconds) return '-';
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

/**
 * Get difficulty badge color classes based on difficulty level
 * @param difficulty Difficulty level string (easy, medium, hard)
 * @returns CSS classes for badge styling
 */
export function getDifficultyBadgeColor(difficulty: string): string {
	switch (difficulty?.toLowerCase()) {
		case 'easy':
			return 'bg-green-500/10 text-green-500 border-green-500/30';
		case 'medium':
			return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
		case 'hard':
			return 'bg-red-500/10 text-red-500 border-red-500/30';
		default:
			return 'bg-muted text-muted-foreground';
	}
}

/**
 * Get difficulty text color classes based on difficulty value (0-100)
 * @param value Difficulty value from 0 to 100
 * @returns CSS classes for text color styling (e.g., "text-green-500")
 */
export function getDifficultyTextColor(value: number): string {
	if (value < 33) return 'text-green-500';
	if (value < 66) return 'text-yellow-500';
	return 'text-red-500';
}
