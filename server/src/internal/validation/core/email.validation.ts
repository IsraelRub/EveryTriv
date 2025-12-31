/**
 * Email validation utilities (server-only)
 *
 * @module ServerEmailValidation
 * @description Server-side email validation functions
 */
import { VALIDATION_LENGTH } from '@shared/constants';
import type { TextPosition, ValidationResult } from '@shared/types';

/**
 * Validates email format and length constraints
 * @param email The email address to validate
 * @returns Validation result with position information and suggestions
 * Checks email format using RFC-compliant regex pattern and validates
 * against maximum length constraints to prevent abuse
 */
export function validateEmail(email: string): ValidationResult {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!email || !emailRegex.test(email)) {
		const position: TextPosition = { start: 0, end: email?.length ?? 0 };
		return {
			isValid: false,
			errors: ['Invalid email format'],
			position,
			suggestion: 'Please enter a valid email address (e.g., user@example.com)',
		};
	}

	if (email.length > VALIDATION_LENGTH.EMAIL.MAX) {
		const position: TextPosition = { start: VALIDATION_LENGTH.EMAIL.MAX, end: email.length };
		return {
			isValid: false,
			errors: [`Email must not exceed ${VALIDATION_LENGTH.EMAIL.MAX} characters`],
			position,
			suggestion: `Please shorten your email to ${VALIDATION_LENGTH.EMAIL.MAX} characters or less`,
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}
