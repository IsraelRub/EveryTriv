import type { BaseValidationResult } from '@shared/types';

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
