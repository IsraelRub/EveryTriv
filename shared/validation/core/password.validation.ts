import { VALIDATION_LENGTH } from '../../constants';
import type { BaseValidationResult, PasswordValidationResult } from '../../types';

export function validatePassword(password: string): PasswordValidationResult {
	const hasMinLength = !!password && password.length >= VALIDATION_LENGTH.PASSWORD.MIN;
	const hasMaxLength = !!password && password.length <= VALIDATION_LENGTH.PASSWORD.MAX;

	const errors: string[] = [];
	const checks = {
		hasMinLength,
	};

	if (!password || !hasMinLength) {
		errors.push(`Password must be at least ${VALIDATION_LENGTH.PASSWORD.MIN} characters long`);
	}

	if (password && !hasMaxLength) {
		errors.push(`Password must not exceed ${VALIDATION_LENGTH.PASSWORD.MAX} characters`);
	}

	return {
		isValid: errors.length === 0,
		errors,
		checks,
	};
}

export function validatePasswordMatch(password: string, confirmPassword: string): BaseValidationResult {
	const errors: string[] = [];

	if (!confirmPassword) {
		errors.push('Please confirm your password');
	} else if (password && confirmPassword !== password) {
		errors.push('Passwords do not match');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
