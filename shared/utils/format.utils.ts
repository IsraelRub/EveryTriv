/**
 * Shared formatting utilities for EveryTriv
 * Used by both client and server for data formatting and display
 *
 * @module FormatUtils
 * @description Data formatting and display utilities for numbers, text, and data presentation
 * @used_by server: server/src/features/gameHistory/gameHistory.service.ts (format scores), client: client/src/components/stats/ScoringSystem.tsx (display formatting), shared/services/logging.service.ts (log formatting)
 */

/**
 * Format points with appropriate suffix (alias for formatNumber)
 * @param points Number of points
 * @returns Formatted points string
 */
export function formatPoints(points: number): string {
	return formatNumber(points, 1, true);
}

/**
 * Format currency amount
 * @param amount Amount to format
 * @param currency Currency code (default: USD)
 * @param locale Locale for formatting (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currency,
	}).format(amount);
}

/**
 * Format number with appropriate suffix (consolidated with formatPoints)
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
 * Format relative time (e.g., "2h ago", "3d ago")
 * @param timestamp Timestamp to format
 * @param now Current timestamp (defaults to now)
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
	const diffInMs = now - timestamp;
	const diffInHours = diffInMs / (1000 * 60 * 60);

	if (diffInHours < 1) {
		return 'Just now';
	} else if (diffInHours < 24) {
		return `${Math.floor(diffInHours)}h ago`;
	} else {
		const diffInDays = Math.floor(diffInHours / 24);
		return `${diffInDays}d ago`;
	}
}

/**
 * Format duration in human readable format
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	return `${hours}h ${minutes}m`;
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
 * Format username with proper casing
 * @param username Username to format
 * @returns Formatted username
 */
export function formatUsername(username: string): string {
	return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
}

/**
 * Format topic name for display
 * @param topic Topic name to format
 * @returns Formatted topic name
 */
export function formatTopic(topic: string): string {
	return topic
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}
