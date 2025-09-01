/**
 * Shared time and date utilities for EveryTriv
 * Used by both client and server for time formatting and calculations
 *
 * @module TimeUtils
 * @description Time and date manipulation utilities for calculations, timestamps, and time-based operations
 * @used_by server: server/src/features/gameHistory/gameHistory.service.ts (time calculations), client: client/src/components/game/GameTimer.tsx (timer display), shared/services/logging.service.ts (timestamp generation)
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
 * Format time in HH:MM:SS format for longer durations
 * @param totalSeconds Total seconds to format
 * @returns Formatted time string
 */
export function formatTimeLong(totalSeconds: number): string {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format time display for game components (consolidated function)
 * @param milliseconds Time in milliseconds
 * @param useLongFormat Whether to use long format for durations over 1 hour
 * @returns Formatted time string
 */
export function formatTimeDisplay(milliseconds: number, useLongFormat: boolean = true): string {
	const seconds = Math.floor(milliseconds / 1000);

	if (useLongFormat && seconds >= 3600) {
		return formatTimeLong(seconds);
	}

	return formatTime(seconds);
}

/**
 * Format time until next reset (e.g., for daily limits)
 * @param nextResetTime Date of next reset
 * @returns Formatted time until reset
 */
export function formatTimeUntilReset(nextResetTime: Date): string {
	const now = new Date();
	const diff = nextResetTime.getTime() - now.getTime();

	if (diff <= 0) {
		return 'Resetting now...';
	}

	const hours = Math.floor(diff / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	} else {
		return `${minutes}m`;
	}
}

/**
 * Get current timestamp as number
 * @returns number Current timestamp in milliseconds
 */
export function getCurrentTimestampMs(): number {
	return Date.now();
}

/**
 * Get current timestamp as ISO string
 * @returns string Current timestamp
 */
export function getCurrentTimestamp(): string {
	return new Date().toISOString();
}

/**
 * Calculate time difference in seconds
 * @param startTime Start time in milliseconds
 * @param endTime End time in milliseconds (defaults to now)
 * @returns number Time difference in seconds
 */
export function calculateTimeDifference(startTime: number, endTime?: number): number {
	const end = endTime || Date.now();
	return Math.floor((end - startTime) / 1000);
}

/**
 * Get time elapsed since a given timestamp
 * @param timestamp Timestamp to calculate from
 * @returns Object with elapsed time components
 */
export function getTimeElapsed(timestamp: number): {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	totalSeconds: number;
} {
	const now = Date.now();
	const diffMs = now - timestamp;
	const totalSeconds = Math.floor(diffMs / 1000);

	const days = Math.floor(totalSeconds / (24 * 60 * 60));
	const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
	const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
	const seconds = totalSeconds % 60;

	return {
		days,
		hours,
		minutes,
		seconds,
		totalSeconds,
	};
}
