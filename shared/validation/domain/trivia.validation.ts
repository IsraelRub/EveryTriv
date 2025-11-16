/**
 * Trivia-specific validation utilities
 *
 * @module TriviaValidation
 * @description Shared validation functions for trivia game input validation
 * @author EveryTriv Team
 */
import { CUSTOM_DIFFICULTY_PREFIX } from '@shared/constants';
import type { TriviaInputValidationResult } from '@shared/types';

import { validateTopicLength } from '../core/topic.validation';
import { isCustomDifficulty, isRegisteredDifficulty } from './difficulty.validation';

/**
 * Performs quick validation for trivia input without external API calls
 *
 * @param topic - The trivia topic string to validate
 * @param difficulty - The difficulty level string to validate
 * @returns TriviaInputValidationResult Validation result with detailed error information
 * @description Validates topic length, difficulty format, and custom difficulty requirements
 */
export function validateTriviaInputQuick(topic: string, difficulty: string): TriviaInputValidationResult {
	const result: TriviaInputValidationResult = {
		topic: { isValid: true, errors: [] },
		difficulty: { isValid: true, errors: [] },
		overall: { isValid: true, canProceed: true },
	};

	if (!topic.trim()) {
		result.topic.isValid = false;
		result.topic.errors.push('Topic is required');
	} else {
		const topicValidation = validateTopicLength(topic);
		if (!topicValidation.isValid && topicValidation.errors.length > 0) {
			result.topic.isValid = false;
			result.topic.errors.push(topicValidation.errors[0]);
		}
	}

	if (!difficulty) {
		result.difficulty.isValid = false;
		result.difficulty.errors.push('Difficulty is required');
	} else if (isCustomDifficulty(difficulty)) {
		const customText = difficulty.substring(CUSTOM_DIFFICULTY_PREFIX.length);
		if (customText.length < 3) {
			result.difficulty.isValid = false;
			result.difficulty.errors.push('Custom difficulty must be at least 3 characters');
		}
	} else {
		if (!isRegisteredDifficulty(difficulty)) {
			result.difficulty.isValid = false;
			result.difficulty.errors.push('Please select a valid difficulty level');
		}
	}

	result.overall.isValid = result.topic.isValid && result.difficulty.isValid;
	result.overall.canProceed = result.overall.isValid;

	return result;
}
