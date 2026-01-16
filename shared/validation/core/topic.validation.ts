import { VALIDATION_LENGTH } from '../../constants';
import type { TextPosition, ValidationResult } from '../../types';

export function validateTopicLength(topic: string): ValidationResult {
	if (!topic || topic.trim().length < VALIDATION_LENGTH.TOPIC.MIN) {
		const position: TextPosition = { start: 0, end: topic?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Topic must be at least ${VALIDATION_LENGTH.TOPIC.MIN} characters long`],
			position,
			suggestion: `Please enter at least ${VALIDATION_LENGTH.TOPIC.MIN} characters for your topic`,
		};
	}

	if (topic.length > VALIDATION_LENGTH.TOPIC.MAX) {
		const position: TextPosition = { start: VALIDATION_LENGTH.TOPIC.MAX, end: topic.length };
		return {
			isValid: false,
			errors: [`Topic must be less than ${VALIDATION_LENGTH.TOPIC.MAX} characters`],
			position,
			suggestion: `Please shorten your topic to ${VALIDATION_LENGTH.TOPIC.MAX} characters or less`,
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}
