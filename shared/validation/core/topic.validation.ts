/**
 * Topic validation utilities
 *
 * @module TopicValidation
 * @description Validation functions for topic length and format
 */
import { VALIDATION_LENGTH } from '../../constants';
import type { Position, ValidationResult } from '../../types';

/**
 * Validate topic length and format
 * @param topic The topic string to validate
 * @returns Validation result with position information and suggestions
 * Validates topic length constraints and format requirements for trivia topics
 */
export function validateTopicLength(topic: string): ValidationResult {
	if (!topic || topic.trim().length < VALIDATION_LENGTH.TOPIC.MIN) {
		const position: Position = { start: 0, end: topic?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Topic must be at least ${VALIDATION_LENGTH.TOPIC.MIN} characters long`],
			position,
			suggestion: `Please enter at least ${VALIDATION_LENGTH.TOPIC.MIN} characters for your topic`,
		};
	}

	if (topic.length > VALIDATION_LENGTH.TOPIC.MAX) {
		const position: Position = { start: VALIDATION_LENGTH.TOPIC.MAX, end: topic.length };
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
