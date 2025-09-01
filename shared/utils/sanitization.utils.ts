/**
 * Shared sanitization utilities for EveryTriv
 * Used by both client and server for data cleaning and security
 *
 * @module SanitizationUtils
 * @description Data cleaning and security utilities
 * @used_by server: server/src/common/validation/validation.service.ts (input sanitization), shared/services/logging.service.ts (log sanitization), server/src/features/user/user.service.ts (text normalization)
 */

/**
 * Sanitize input text by removing HTML tags and limiting length
 * @param input The input to sanitize
 * @param maxLength Maximum length (default: 1000)
 * @returns string Sanitized input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
	return input
		.trim()
		.replace(/[<>]/g, '') // Remove potential HTML tags
		.substring(0, maxLength);
}

/**
 * Sanitize log message by removing sensitive information
 * @param message The message to sanitize
 * @returns string Sanitized message
 */
export function sanitizeLogMessage(message: string): string {
	return message
		.replace(/password["\s]*[:=]["\s]*[^"\s,}]+/gi, 'password: ***')
		.replace(/token["\s]*[:=]["\s]*[^"\s,}]+/gi, 'token: ***')
		.replace(/key["\s]*[:=]["\s]*[^"\s,}]+/gi, 'key: ***')
		.replace(/secret["\s]*[:=]["\s]*[^"\s,}]+/gi, 'secret: ***');
}

/**
 * Sanitize email address
 * @param email Email to sanitize
 * @returns string Sanitized email
 */
export function sanitizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/**
 * Sanitize card number by removing spaces and non-digit characters
 * @param cardNumber Card number to sanitize
 * @returns string Sanitized card number
 */
export function sanitizeCardNumber(cardNumber: string): string {
	return cardNumber.replace(/\s/g, '').replace(/\D/g, '');
}

/**
 * Truncate text to specified length with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns string Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength - 3) + '...';
}

/**
 * Normalize text by removing extra spaces and converting to lowercase
 * @param text Text to normalize
 * @returns string Normalized text
 */
export function normalizeText(text: string): string {
	return text
		.trim()
		.replace(/\s+/g, ' ') // Replace multiple spaces with single space
		.toLowerCase();
}

/**
 * Escape special characters for safe display
 * @param text Text to escape
 * @returns string Escaped text
 */
export function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	return text.replace(/[&<>"']/g, m => map[m]);
}
