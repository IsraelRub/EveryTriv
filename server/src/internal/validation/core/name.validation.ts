/**
 * Name validation utilities (server-only)
 *
 * @module ServerNameValidation
 * @description Server-side name validation functions
 */
import { VALIDATION_CONFIG } from '@shared/constants';
import type { BaseValidationResult } from '@shared/types';

/**
 * Validates name (first name or last name) format and length
 * @param name The name string to validate
 * @param fieldName The field name for error messages (defaults to 'Name')
 * @returns BaseValidationResult Validation result with errors if invalid
 * @description Validates name length and allowed characters using VALIDATION_CONFIG limits
 */
export function validateName(name: string, fieldName: string = 'Name'): BaseValidationResult {
	const trimmed = name.trim();

	if (trimmed.length === 0) {
		return {
			isValid: false,
			errors: [`${fieldName} is required`],
		};
	}

	const { MIN_LENGTH, MAX_LENGTH } = VALIDATION_CONFIG.limits.FIRST_NAME;

	if (trimmed.length < MIN_LENGTH) {
		return {
			isValid: false,
			errors: [`${fieldName} must be at least ${MIN_LENGTH} character${MIN_LENGTH > 1 ? 's' : ''} long`],
		};
	}

	if (trimmed.length > MAX_LENGTH) {
		return {
			isValid: false,
			errors: [`${fieldName} cannot exceed ${MAX_LENGTH} characters`],
		};
	}

	// Validate allowed characters: letters, spaces, apostrophes, and hyphens
	const namePattern = /^[a-zA-Z\s'-]+$/;
	if (!namePattern.test(trimmed)) {
		return {
			isValid: false,
			errors: [`${fieldName} can only contain letters, spaces, apostrophes, and hyphens`],
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}
