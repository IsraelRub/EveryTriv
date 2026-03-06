import { VALIDATION_LENGTH } from '@shared/constants';
import type { Position, ValidationResult } from '@shared/types';

export function validateTopicLength(topic: string): ValidationResult {
	const { MIN, MAX } = VALIDATION_LENGTH.TOPIC;
	const trimmedLen = topic?.trim().length ?? 0;

	if (!topic || trimmedLen < MIN) {
		const position: Position = { start: 0, end: topic?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Topic must be at least ${MIN} character${MIN > 1 ? 's' : ''} long`],
			position,
			suggestion: `Please enter at least ${MIN} characters`,
		};
	}

	if (topic.length > MAX) {
		const position: Position = { start: MAX, end: topic.length };
		return {
			isValid: false,
			errors: [`Topic cannot exceed ${MAX} characters`],
			position,
			suggestion: `Please shorten to ${MAX} characters or less`,
		};
	}

	return { isValid: true, errors: [] };
}
