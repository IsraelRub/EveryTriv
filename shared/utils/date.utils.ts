/**
 * Shared date utilities for EveryTriv
 * Used by both client and server for date manipulation and formatting
 *
 * @module DateUtils
 * @description Date manipulation and formatting utilities
 * @used_by client: client/src/components/stats/CustomDifficultyHistory.tsx (date display), shared/services/logging (date formatting)
 */

/**
 * Format date for display
 * @param date Date to format
 * @param locale Locale for formatting (default: en-US)
 * @returns Formatted date string
 */
export function formatDate(date: Date, locale: string = 'en-US'): string {
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(date);
}

/**
 * Format date with time
 * @param date Date to format
 * @param locale Locale for formatting (default: en-US)
 * @returns Formatted date with time string
 */
export function formatDateTime(date: Date, locale: string = 'en-US'): string {
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}

/**
 * Format date in short format (MM/DD/YYYY)
 * @param date Date to format
 * @returns Short formatted date string
 */
export function formatDateShort(date: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		month: '2-digit',
		day: '2-digit',
		year: 'numeric',
	}).format(date);
}

/**
 * Get start of day for a given date
 * @param date Date to get start of day for
 * @returns Date object set to start of day
 */
export function getStartOfDay(date: Date): Date {
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);
	return startOfDay;
}

/**
 * Get end of day for a given date
 * @param date Date to get end of day for
 * @returns Date object set to end of day
 */
export function getEndOfDay(date: Date): Date {
	const endOfDay = new Date(date);
	endOfDay.setHours(23, 59, 59, 999);
	return endOfDay;
}

/**
 * Check if a date is today
 * @param date Date to check
 * @returns boolean True if date is today
 */
export function isToday(date: Date): boolean {
	const today = new Date();
	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	);
}

/**
 * Check if a date is yesterday
 * @param date Date to check
 * @returns boolean True if date is yesterday
 */
export function isYesterday(date: Date): boolean {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	return (
		date.getDate() === yesterday.getDate() &&
		date.getMonth() === yesterday.getMonth() &&
		date.getFullYear() === yesterday.getFullYear()
	);
}

/**
 * Get next reset time (e.g., for daily limits)
 * @param resetHour Hour of day for reset (default: 0 = midnight)
 * @returns Date object for next reset
 */
export function getNextResetTime(resetHour: number = 0): Date {
	const now = new Date();
	const resetTime = new Date(now);
	resetTime.setHours(resetHour, 0, 0, 0);

	// If reset time has passed today, set to tomorrow
	if (resetTime <= now) {
		resetTime.setDate(resetTime.getDate() + 1);
	}

	return resetTime;
}

/**
 * Calculate age from birth date
 * @param birthDate Date of birth
 * @returns Age in years or null if birth date is invalid
 */
export function calculateAge(birthDate: Date | string | null | undefined): number | null {
	if (!birthDate) {
		return null;
	}

	try {
		const birth = new Date(birthDate);
		const today = new Date();

		// Check if birth date is valid
		if (isNaN(birth.getTime())) {
			return null;
		}

		// Check if birth date is in the future
		if (birth > today) {
			return null;
		}

		// Calculate age using 365.25 days per year to account for leap years
		const ageInMilliseconds = today.getTime() - birth.getTime();
		const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

		return Math.floor(ageInYears);
	} catch (error) {
		return null;
	}
}
