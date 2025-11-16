/**
 * Username validation utilities
 *
 * @module UsernameValidation
 * @description Validation functions for username format and constraints
 */
import { VALIDATION_LIMITS } from '../../constants';
import type { Position, ValidationResult } from '../../types';

/**
 * Validates username format and constraints
 * @param username The username string to validate
 * @returns Validation result with position information and suggestions
 * Checks username length, character restrictions, and format requirements.
 * Only allows letters, numbers, underscores, and hyphens
 */
export function validateUsername(username: string): ValidationResult {
	const usernameRegex = /^[a-zA-Z0-9_-]+$/;

	if (!username || username.length < VALIDATION_LIMITS.USERNAME.MIN_LENGTH) {
		const position: Position = { start: 0, end: username?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Username must be at least ${VALIDATION_LIMITS.USERNAME.MIN_LENGTH} characters long`],
			position,
			suggestion: `Please enter at least ${VALIDATION_LIMITS.USERNAME.MIN_LENGTH} characters`,
		};
	}

	if (username.length > VALIDATION_LIMITS.USERNAME.MAX_LENGTH) {
		const position: Position = { start: VALIDATION_LIMITS.USERNAME.MAX_LENGTH, end: username.length };
		return {
			isValid: false,
			errors: [`Username must not exceed ${VALIDATION_LIMITS.USERNAME.MAX_LENGTH} characters`],
			position,
			suggestion: `Please shorten your username to ${VALIDATION_LIMITS.USERNAME.MAX_LENGTH} characters or less`,
		};
	}

	if (!usernameRegex.test(username)) {
		let invalidIndex = -1;
		for (let i = 0; i < username.length; i++) {
			if (!/[a-zA-Z0-9_-]/.test(username[i])) {
				invalidIndex = i;
				break;
			}
		}
		const position: Position = { start: invalidIndex, end: invalidIndex + 1 };
		return {
			isValid: false,
			errors: ['Username can only contain letters, numbers, underscores, and hyphens'],
			position,
			suggestion: 'Remove special characters and use only letters, numbers, underscores, and hyphens',
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}
