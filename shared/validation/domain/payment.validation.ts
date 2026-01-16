import type { ValidationResult } from '../../types';
import { sanitizeCardNumber } from '../../utils/infrastructure/sanitization.utils';

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

export function validateExpiryDate(expiryDate: string): ValidationResult {
	const errors: string[] = [];
	let suggestion: string | undefined;

	if (!expiryDate || typeof expiryDate !== 'string' || expiryDate.trim().length === 0) {
		errors.push('Expiry date is required');
		suggestion = 'Please enter your card expiry date';
		return {
			isValid: false,
			errors,
			suggestion,
		};
	}

	const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
	if (!expiryPattern.test(expiryDate)) {
		errors.push('Expiry date must be in MM/YY format');
		suggestion = 'Use MM/YY format (e.g., 12/25 for December 2025)';
		return {
			isValid: false,
			errors,
			suggestion,
		};
	}

	const [month, year] = expiryDate.split('/');
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear() % 100;
	const currentMonth = currentDate.getMonth() + 1;

	if (month != null) {
		const monthNum = parseInt(month, 10);
		if (monthNum < 1 || monthNum > 12) {
			errors.push('Month must be between 01 and 12');
			suggestion = 'Enter a valid month (01-12)';
			return {
				isValid: false,
				errors,
				suggestion,
			};
		}
	}

	if (month != null && year != null) {
		const monthNum = parseInt(month, 10);
		const yearNum = parseInt(year, 10);
		if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
			errors.push('Card has expired');
			suggestion = 'Please use a card that has not expired';
			return {
				isValid: false,
				errors,
				suggestion,
			};
		}
	}

	return {
		isValid: true,
		errors: [],
	};
}

export function validateCVV(cvv: string): ValidationResult {
	const errors: string[] = [];
	let suggestion: string | undefined;

	if (!cvv || typeof cvv !== 'string' || cvv.trim().length === 0) {
		errors.push('CVV is required');
		suggestion = 'Please enter your 3-4 digit CVV';
		return {
			isValid: false,
			errors,
			suggestion,
		};
	}

	const cleanCvv = cvv.replace(/\s+/g, '');
	if (cleanCvv.length < 3 || cleanCvv.length > 4) {
		errors.push('CVV must be 3-4 digits');
		suggestion = 'Enter the 3-4 digit security code on the back of your card';
		return {
			isValid: false,
			errors,
			suggestion,
		};
	}

	if (!/^\d+$/.test(cleanCvv)) {
		errors.push('CVV can only contain digits');
		suggestion = 'Remove any letters or special characters from your CVV';
		return {
			isValid: false,
			errors,
			suggestion,
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}
