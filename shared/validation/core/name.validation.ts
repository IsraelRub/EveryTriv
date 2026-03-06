import { VALIDATION_LENGTH } from '@shared/constants';
import type { BaseValidationResult } from '@shared/types';

export function validateName(
	name: string,
	options: {
		fieldName?: string;
		min?: number;
		max?: number;
		required?: boolean;
	} = {}
): BaseValidationResult {
	const {
		fieldName = 'Name',
		min = VALIDATION_LENGTH.NAME.MIN,
		max = VALIDATION_LENGTH.NAME.MAX,
		required = true,
	} = options;
	const trimmed = name.trim();

	if (trimmed.length === 0) {
		if (required) {
			return {
				isValid: false,
				errors: [`${fieldName} is required`],
			};
		}
		// Empty name is allowed when not required
		return {
			isValid: true,
			errors: [],
		};
	}

	if (trimmed.length < min) {
		return {
			isValid: false,
			errors: [`${fieldName} must be at least ${min} character${min > 1 ? 's' : ''} long`],
		};
	} else if (trimmed.length > max) {
		return {
			isValid: false,
			errors: [`${fieldName} cannot exceed ${max} characters`],
		};
	}

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
