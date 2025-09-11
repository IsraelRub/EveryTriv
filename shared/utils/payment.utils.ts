/**
 * Payment Utilities
 * @module PaymentUtils
 * @description Payment-related utility functions
 */

/**
 * Format currency function
 * @function formatCurrency
 * @description Format currency value
 * @used_by server: server/src/features/payment/services/payment.service.ts
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency,
	}).format(amount);
}

/**
 * Generate payment intent ID function
 * @function generatePaymentIntentId
 * @description Generate unique payment intent ID
 * @used_by server: server/src/features/payment/services/payment.service.ts
 */
export function generatePaymentIntentId(): string {
	return `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
