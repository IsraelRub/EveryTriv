/**
 * Payment-related validation utilities
 *
 * @module PaymentValidation
 * @description Shared validation functions for payment processing and transaction validation
 * @author EveryTriv Team
 */
import type { BaseValidationResult } from '../../types';
import { sanitizeCardNumber } from '../../utils/infrastructure/sanitization.utils';

/**
 * Validates payment amount and currency constraints
 *
 * @param amount The payment amount to validate
 * @param currency The currency code for validation (defaults to USD)
 * @returns PaymentValidationResult Validation result with errors and warnings
 * @description Checks payment amount limits, currency-specific rules, and provides warnings for large amounts
 */
export function validatePaymentAmount(amount: number, currency: string = 'USD'): BaseValidationResult {
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
 * Validates credit card number using Luhn algorithm and length constraints
 *
 * @param rawNumber The credit card number string to validate
 * @returns boolean True if the card number passes validation (Luhn algorithm and length 12-19)
 * @description Validates credit card number using Luhn algorithm and checks length constraints.
 * Card numbers must be between 12 and 19 digits long and pass the Luhn checksum validation.
 */
export function isValidCardNumber(rawNumber: string): boolean {
	const digits = sanitizeCardNumber(rawNumber);
	if (digits.length < 12 || digits.length > 19) {
		return false;
	}

	let sum = 0;
	let shouldDouble = false;

	for (let index = digits.length - 1; index >= 0; index -= 1) {
		const digit = parseInt(digits.charAt(index), 10);
		if (Number.isNaN(digit)) {
			return false;
		}

		if (shouldDouble) {
			let doubled = digit * 2;
			if (doubled > 9) {
				doubled -= 9;
			}
			sum += doubled;
		} else {
			sum += digit;
		}

		shouldDouble = !shouldDouble;
	}

	return sum % 10 === 0;
}
