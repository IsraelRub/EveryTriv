/**
 * Topic validation utilities (server-only)
 *
 * @module ServerTopicValidation
 * @description Server-side topic validation functions
 */
import { VALIDATION_CONFIG } from '@shared/constants';
import type { TextPosition, ValidationResult } from '@shared/types';

/**
 * Validate topic length and format
 * @param topic The topic string to validate
 * @returns Validation result with position information and suggestions
 * Validates topic length constraints and format requirements for trivia topics
 */
export function validateTopicLength(topic: string): ValidationResult {
	if (!topic || topic.trim().length < VALIDATION_CONFIG.limits.TOPIC.MIN_LENGTH) {
		const position: TextPosition = { start: 0, end: topic?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Topic must be at least ${VALIDATION_CONFIG.limits.TOPIC.MIN_LENGTH} characters long`],
			position,
			suggestion: `Please enter at least ${VALIDATION_CONFIG.limits.TOPIC.MIN_LENGTH} characters for your topic`,
		};
	}

	if (topic.length > VALIDATION_CONFIG.limits.TOPIC.MAX_LENGTH) {
		const position: TextPosition = { start: VALIDATION_CONFIG.limits.TOPIC.MAX_LENGTH, end: topic.length };
		return {
			isValid: false,
			errors: [`Topic must be less than ${VALIDATION_CONFIG.limits.TOPIC.MAX_LENGTH} characters`],
			position,
			suggestion: `Please shorten your topic to ${VALIDATION_CONFIG.limits.TOPIC.MAX_LENGTH} characters or less`,
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}
