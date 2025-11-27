/**
 * Shared formatting utilities
 *
 * @module SharedFormatUtils
 * @description Data formatting utilities shared between client and server
 */

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
 * Calculate price per credit with rounding
 * @param price Price amount
 * @param credits Number of credits
 * @returns Rounded price per credit
 */
export function calculatePricePerCredit(price: number, credits: number): number {
	return parseFloat((price / credits).toFixed(4));
}
