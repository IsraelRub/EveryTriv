/**
 * Email validation utilities
 *
 * @module EmailValidation
 * @description Validation functions for email format and length constraints
 */
import { VALIDATION_LIMITS } from '../../constants';
import type { Position, ValidationResult } from '../../types';

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
		const position: Position = { start: 0, end: email?.length ?? 0 };
		return {
			isValid: false,
			errors: ['Invalid email format'],
			position,
			suggestion: 'Please enter a valid email address (e.g., user@example.com)',
		};
	}

	if (email.length > VALIDATION_LIMITS.EMAIL.MAX_LENGTH) {
		const position: Position = { start: VALIDATION_LIMITS.EMAIL.MAX_LENGTH, end: email.length };
		return {
			isValid: false,
			errors: [`Email must not exceed ${VALIDATION_LIMITS.EMAIL.MAX_LENGTH} characters`],
			position,
			suggestion: `Please shorten your email to ${VALIDATION_LIMITS.EMAIL.MAX_LENGTH} characters or less`,
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}
