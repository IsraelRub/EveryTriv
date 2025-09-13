/**
 * Payment-related validation utilities
 *
 * @module PaymentValidation
 * @description Shared validation functions for payment processing and transaction validation
 * @author EveryTriv Team
 */
import type { PaymentValidationResult } from '../types/domain/validation/validation.types';

/**
 * Validates payment amount and currency constraints
 *
 * @param amount - The payment amount to validate
 * @param currency - The currency code for validation (defaults to USD)
 * @returns PaymentValidationResult Validation result with errors and warnings
 * @description Checks payment amount limits, currency-specific rules, and provides warnings for large amounts
 */
export function validatePaymentAmount(amount: number, currency: string = 'USD'): PaymentValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!amount || amount <= 0) {
		errors.push('Payment amount must be greater than 0');
	}

	if (amount > 10000) {
		errors.push('Payment amount must be less than 10000');
	}

	if (currency === 'USD' && amount > 1000) {
		warnings.push('Large payment amount detected');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validates credit card number using Luhn algorithm
 *
 * @param cardNumber - The credit card number string to validate
 * @returns boolean True if the card number passes Luhn algorithm validation
 * @description Implements Luhn algorithm to check credit card number validity without external API calls
 */
export function isValidLuhn(cardNumber: string): boolean {
	let sum = 0;
	let isEven = false;

	const cleanNumber = cardNumber.replace(/\s/g, '').split('').reverse().join('');

	for (let i = 0; i < cleanNumber.length; i++) {
		let digit = parseInt(cleanNumber[i], 10);

		if (isEven) {
			digit *= 2;
			if (digit > 9) {
				digit -= 9;
			}
		}

		sum += digit;
		isEven = !isEven;
	}

	return sum % 10 === 0;
}
