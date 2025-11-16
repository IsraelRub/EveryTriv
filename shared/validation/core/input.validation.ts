/**
 * Input content validation utilities
 *
 * @module InputValidation
 * @description Validation functions for input content security and content filtering
 */
import type { Position, ValidationResult } from '../../types';

/**
 * Validates input content for security and content filtering
 * @param input The input string to validate
 * @returns Promise resolving to validation result with position information and suggestions
 * Performs comprehensive content validation including length checks,
 * harmful content detection, and security filtering to prevent XSS attacks
 */
export async function validateInputContent(input: string): Promise<ValidationResult> {
	const minLength = 1;
	const maxLength = 1000;

	if (!input || input.trim().length < minLength) {
		const position: Position = { start: 0, end: input?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Input must be at least ${minLength} characters long`],
			position,
			suggestion: 'Please provide some content',
		};
	}

	if (input.length > maxLength) {
		const position: Position = { start: maxLength, end: input.length };
		return {
			isValid: false,
			errors: [`Input must not exceed ${maxLength} characters`],
			position,
			suggestion: `Please shorten your input to ${maxLength} characters or less`,
		};
	}

	const harmfulPatterns = [
		{ pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, name: 'script tags' },
		{ pattern: /javascript:/gi, name: 'javascript protocol' },
		{ pattern: /on\w+\s*=/gi, name: 'event handlers' },
		{ pattern: /data:text\/html/gi, name: 'data URLs' },
	];

	for (const { pattern, name } of harmfulPatterns) {
		const match = pattern.exec(input);
		if (match) {
			const position: Position = { start: match.index, end: match.index + match[0].length };
			return {
				isValid: false,
				errors: [`Input contains potentially harmful content: ${name}`],
				position,
				suggestion: 'Please remove any script tags, event handlers, or data URLs',
			};
		}
	}

	return {
		isValid: true,
		errors: [],
	};
}
