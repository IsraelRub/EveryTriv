import { VALIDATION_LENGTH } from '@shared/constants';

import type { Position, ValidationResult } from '../../types';

export async function validateInputContent(input: string): Promise<ValidationResult> {
	const { MIN, MAX } = VALIDATION_LENGTH.INPUT;

	if (!input || input.trim().length < MIN) {
		const position: Position = { start: 0, end: input?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Input must be at least ${MIN} characters long`],
			position,
			suggestion: 'Please provide some content',
		};
	}

	if (input.length > MAX) {
		const position: Position = { start: MAX, end: input.length };
		return {
			isValid: false,
			errors: [`Input must not exceed ${MAX} characters`],
			position,
			suggestion: `Please shorten your input to ${MAX} characters or less`,
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
