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

/**
 * Format user display name from firstName and lastName
 * @param firstName First name (optional)
 * @param lastName Last name (optional)
 * @param fallback Fallback value if both names are missing (default: empty string)
 * @returns Formatted display name or fallback
 */
export function formatDisplayName(firstName?: string, lastName?: string, fallback: string = ''): string {
	if (firstName && lastName) {
		return `${firstName} ${lastName}`;
	}

	if (firstName) {
		return firstName;
	}

	if (lastName) {
		return lastName;
	}

	return fallback;
}
