/**
 * Input content validation utilities (server-only)
 */
import type { TextPosition, ValidationResult } from '@shared/types';

/**
 * Validates input content for security and content filtering
 * This function VALIDATES input and returns detailed validation results.
 * It does NOT modify the input - it only checks if it's valid.
 * For cleaning/sanitizing input, use sanitizeInput() from @shared/utils.
 */
export async function validateInputContent(input: string): Promise<ValidationResult> {
	const minLength = 1;
	const maxLength = 1000;

	if (!input || input.trim().length < minLength) {
		const position: TextPosition = { start: 0, end: input?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Input must be at least ${minLength} characters long`],
			position,
			suggestion: 'Please provide some content',
		};
	}

	if (input.length > maxLength) {
		const position: TextPosition = { start: maxLength, end: input.length };
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
			const position: TextPosition = { start: match.index, end: match.index + match[0].length };
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
