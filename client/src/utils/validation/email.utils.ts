/**
 * Email validation utilities (client-side)
 *
 * @module ClientEmailValidation
 * @description Client-side email validation functions
 */
import type { BaseValidationResult } from '@shared/types';

/**
 * Validates email format (basic check)
 * @param email The email address to validate
 * @returns BaseValidationResult Validation result with errors if invalid
 * @description Validates email format using basic pattern check for client-side validation
 * Note: Full validation is performed on the server
 */
export function validateEmailFormat(email: string): BaseValidationResult {
	const errors: string[] = [];

	if (!email || !email.trim()) {
		errors.push('Email is required');
	} else if (!email.includes('@')) {
		errors.push('Please enter a valid email address');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
