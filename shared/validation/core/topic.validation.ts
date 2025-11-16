/**
 * Topic validation utilities
 *
 * @module TopicValidation
 * @description Validation functions for topic length and format
 */
import { VALIDATION_LIMITS } from '../../constants';
import type { Position, ValidationResult } from '../../types';

/**
 * Validate topic length and format
 * @param topic The topic string to validate
 * @returns Validation result with position information and suggestions
 * Validates topic length constraints and format requirements for trivia topics
 */
export function validateTopicLength(topic: string): ValidationResult {
	if (!topic || topic.trim().length < VALIDATION_LIMITS.TOPIC.MIN_LENGTH) {
		const position: Position = { start: 0, end: topic?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Topic must be at least ${VALIDATION_LIMITS.TOPIC.MIN_LENGTH} characters long`],
			position,
			suggestion: `Please enter at least ${VALIDATION_LIMITS.TOPIC.MIN_LENGTH} characters for your topic`,
		};
	}

	if (topic.length > VALIDATION_LIMITS.TOPIC.MAX_LENGTH) {
		const position: Position = { start: VALIDATION_LIMITS.TOPIC.MAX_LENGTH, end: topic.length };
		return {
			isValid: false,
			errors: [`Topic must be less than ${VALIDATION_LIMITS.TOPIC.MAX_LENGTH} characters`],
			position,
			suggestion: `Please shorten your topic to ${VALIDATION_LIMITS.TOPIC.MAX_LENGTH} characters or less`,
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}
