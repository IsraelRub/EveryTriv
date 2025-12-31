/**
 * Game-related validation utilities (server-only)
 *
 * @module ServerGameValidation
 * @description Server-side game validation functions
 */
import { VALIDATION_LENGTH } from '@shared/constants';
import type { BaseValidationResult } from '@shared/types';

/**
 * Validates game answer text input
 *
 * @param answer The answer text to validate
 * @returns BaseValidationResult Validation result with errors if invalid
 * @description Validates answer length, inappropriate content, and excessive repetition
 */
export function validateGameAnswer(answer: string): BaseValidationResult {
	const trimmed = answer.trim();

	if (trimmed.length === 0) {
		return {
			isValid: false,
			errors: ['Answer cannot be empty'],
		};
	}

	const maxLength = VALIDATION_LENGTH.ANSWER.MAX;
	if (answer.length > maxLength) {
		return {
			isValid: false,
			errors: [`Answer cannot exceed ${maxLength} characters`],
		};
	}

	// Check for inappropriate content
	const inappropriateWords = ['spam', 'fake', 'dummy'];
	const lowerAnswer = trimmed.toLowerCase();
	for (const word of inappropriateWords) {
		if (lowerAnswer.includes(word)) {
			return {
				isValid: false,
				errors: ['Answer contains inappropriate content'],
			};
		}
	}

	// Check for excessive repetition
	const words = trimmed.split(/\s+/);
	const wordCount = words.length;
	if (wordCount > 10) {
		const uniqueWords = new Set(words.map(w => w.toLowerCase()));
		const uniqueRatio = uniqueWords.size / wordCount;
		if (uniqueRatio < 0.3) {
			return {
				isValid: false,
				errors: ['Answer appears to have excessive repetition'],
			};
		}
	}

	return {
		isValid: true,
		errors: [],
	};
}
