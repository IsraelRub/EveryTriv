import { LengthKey } from '@shared/constants';
import type { ValidationResult } from '@shared/types';

import { validateStringLength } from './content.validation';

export function validateEmail(email: string): ValidationResult {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!email || !emailRegex.test(email)) {
		return {
			isValid: false,
			errors: ['Invalid email format'],
		};
	}

	const lengthResult = validateStringLength(email, LengthKey.EMAIL);
	if (!lengthResult.isValid) {
		return lengthResult;
	}

	return { isValid: true, errors: [] };
}
