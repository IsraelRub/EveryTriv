/**
 * Password validation utilities (client-side)
 *
 * @module ClientPasswordValidation
 * @description Client-side password validation functions
 */
import { VALIDATION_LENGTH } from '@shared/constants';
import type { BaseValidationResult } from '@shared/types';
import { VALIDATION_MESSAGES } from '@/constants';

/**
 * Validates password length requirements
 * @param password The password string to validate
 * @returns BaseValidationResult Validation result with errors if invalid
 * @description Validates password length constraints for client-side validation
 */
export function validatePasswordLength(password: string): BaseValidationResult {
	const errors: string[] = [];

	if (!password) {
		errors.push(VALIDATION_MESSAGES.PASSWORD_REQUIRED);
	} else {
		if (password.length < VALIDATION_LENGTH.PASSWORD.MIN) {
			errors.push(`Password must be at least ${VALIDATION_LENGTH.PASSWORD.MIN} characters`);
		}
		if (password.length > VALIDATION_LENGTH.PASSWORD.MAX) {
			errors.push(`Password must not exceed ${VALIDATION_LENGTH.PASSWORD.MAX} characters`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Validates password confirmation matches
 * @param password The password string
 * @param confirmPassword The confirmation password string
 * @returns BaseValidationResult Validation result with errors if invalid
 * @description Validates that password and confirmation password match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): BaseValidationResult {
	const errors: string[] = [];

	if (!confirmPassword) {
		errors.push(VALIDATION_MESSAGES.PASSWORD_CONFIRMATION_REQUIRED);
	} else if (password && confirmPassword !== password) {
		errors.push(VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH);
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Validates password for form submission
 * @param passwordData Object containing password and optional confirmPassword
 * @returns BaseValidationResult Validation result with errors if invalid
 * @description Validates password length and optional confirmation match
 */
export function validatePasswordForm(passwordData: {
	newPassword: string;
	confirmPassword?: string;
}): BaseValidationResult {
	const lengthValidation = validatePasswordLength(passwordData.newPassword);
	const errors: string[] = [...lengthValidation.errors];

	if (passwordData.confirmPassword !== undefined) {
		const matchValidation = validatePasswordMatch(passwordData.newPassword, passwordData.confirmPassword);
		errors.push(...matchValidation.errors);
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
