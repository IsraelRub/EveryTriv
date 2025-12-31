/**
 * Client-side formatting utilities
 *
 * @module ClientFormatUtils
 * @description Data formatting and display utilities for client-side use
 * @used_by client/src/components, client/src/views
 */

import { defaultValidators } from '@shared/constants';

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
 * @returns Formatted time string with unit (e.g., "30s", "2m", "1h")
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
 * Format date to readable string
 * @param date Date object or date string
 * @param defaultValue Default value to return if date is invalid (default: "-")
 * @returns Formatted date string (e.g., "Jan 15, 2024") or defaultValue if invalid
 */
export function formatDate(date: Date | string | null | undefined, defaultValue: string = '-'): string {
	
	if (!date || !defaultValidators.date(date)) {
		return defaultValue;
	}

	const dateObj = typeof date === 'string' ? new Date(date) : date;

	return dateObj.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

/**
 * Format duration in seconds to readable string with hours, minutes, and seconds
 * @param seconds Duration in seconds
 * @returns Formatted duration string (e.g., "1h 30m 45s", "5m 30s", or "30s")
 */
export function formatDuration(seconds: number): string {
	if (!seconds) return '-';
	
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	
	const parts: string[] = [];
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
	
	return parts.join(' ');
}
