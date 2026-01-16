import { VALIDATION_LENGTH } from '@shared/constants';
import type { BaseValidationResult } from '@shared/types';

export function validateFirstName(name: string): BaseValidationResult {
	const trimmed = name.trim();

	if (trimmed.length === 0) {
		return {
			isValid: false,
			errors: ['First name is required'],
		};
	}

	const { MIN, MAX } = VALIDATION_LENGTH.FIRST_NAME;

	if (trimmed.length < MIN) {
		return {
			isValid: false,
			errors: [`First name must be at least ${MIN} character${MIN > 1 ? 's' : ''} long`],
		};
	}

	if (trimmed.length > MAX) {
		return {
			isValid: false,
			errors: [`First name cannot exceed ${MAX} characters`],
		};
	}

	// Validate allowed characters: letters, spaces, apostrophes, and hyphens
	const namePattern = /^[a-zA-Z\s'-]+$/;
	if (!namePattern.test(trimmed)) {
		return {
			isValid: false,
			errors: ['First name can only contain letters, spaces, apostrophes, and hyphens'],
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}

export function validateLastName(name: string, required: boolean = false): BaseValidationResult {
	const trimmed = name.trim();

	if (trimmed.length === 0) {
		if (required) {
			return {
				isValid: false,
				errors: ['Last name is required'],
			};
		}
		// Empty last name is allowed when not required
		return {
			isValid: true,
			errors: [],
		};
	}

	const { MIN, MAX } = VALIDATION_LENGTH.LAST_NAME;

	if (trimmed.length < MIN) {
		return {
			isValid: false,
			errors: [`Last name must be at least ${MIN} character${MIN > 1 ? 's' : ''} long`],
		};
	}

	if (trimmed.length > MAX) {
		return {
			isValid: false,
			errors: [`Last name cannot exceed ${MAX} characters`],
		};
	}

	// Validate allowed characters: letters, spaces, apostrophes, and hyphens
	const namePattern = /^[a-zA-Z\s'-]+$/;
	if (!namePattern.test(trimmed)) {
		return {
			isValid: false,
			errors: ['Last name can only contain letters, spaces, apostrophes, and hyphens'],
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}

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
		min = VALIDATION_LENGTH.FIRST_NAME.MIN,
		max = VALIDATION_LENGTH.FIRST_NAME.MAX,
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
	}

	if (trimmed.length > max) {
		return {
			isValid: false,
			errors: [`${fieldName} cannot exceed ${max} characters`],
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
