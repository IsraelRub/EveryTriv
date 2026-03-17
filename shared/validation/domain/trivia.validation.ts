import { DIFFICULTIES, LengthKey } from '@shared/constants';
import type { GameDifficulty, TriviaInputValidationResult, ValidationResult } from '@shared/types';

import { validateNoForbiddenWords, validateStringLength } from '../core/content.validation';
import {
	extractCustomDifficultyText,
	isCustomDifficulty,
	isRegisteredDifficulty,
	validateCustomDifficultyText,
} from './difficulty.validation';

export function validateTriviaInputQuick(topic: string, difficulty: string): TriviaInputValidationResult {
	const result: TriviaInputValidationResult = {
		topic: { isValid: true, errors: [] },
		difficulty: { isValid: true, errors: [] },
		overall: { isValid: true, canProceed: true },
	};

	const topicLengthResult = validateStringLength(topic, LengthKey.TOPIC);
	const topicValidation = !topicLengthResult.isValid
		? topicLengthResult
		: validateNoForbiddenWords(topic ?? '', 'Topic');
	if (!topicValidation.isValid && topicValidation.errors.length > 0) {
		result.topic = { isValid: false, errors: topicValidation.errors };
	}

	if (typeof difficulty !== 'string' || !difficulty.trim()) {
		result.difficulty = { isValid: false, errors: ['Difficulty is required'] };
	} else if (isCustomDifficulty(difficulty)) {
		const customText = extractCustomDifficultyText(difficulty);
		const customValidation = validateCustomDifficultyText(customText);
		if (!customValidation.isValid) {
			result.difficulty = customValidation;
		}
	} else if (!isRegisteredDifficulty(difficulty)) {
		result.difficulty = {
			isValid: false,
			errors: ['Please select a valid difficulty level'],
		};
	}

	result.overall.isValid = result.topic.isValid && result.difficulty.isValid;
	result.overall.canProceed = result.overall.isValid;

	return result;
}

export function validateTriviaRequest(topic: string, difficulty: GameDifficulty): ValidationResult {
	const errors: string[] = [];

	// Validate topic using shared function
	const topicLengthResult = validateStringLength(topic, LengthKey.TOPIC);
	const topicValidation = !topicLengthResult.isValid ? topicLengthResult : validateNoForbiddenWords(topic, 'Topic');
	if (!topicValidation.isValid) {
		errors.push(...topicValidation.errors);
	}

	// Validate difficulty
	if (typeof difficulty !== 'string' || !difficulty.trim()) {
		errors.push('Difficulty is required');
	} else if (isCustomDifficulty(difficulty)) {
		// Validate custom difficulty using shared validation function
		const customText = extractCustomDifficultyText(difficulty);
		const customDifficultyValidation = validateCustomDifficultyText(customText);
		if (!customDifficultyValidation.isValid) {
			errors.push(...customDifficultyValidation.errors);
		}
	} else {
		if (!isRegisteredDifficulty(difficulty)) {
			errors.push(`Difficulty must be one of: ${[...DIFFICULTIES].join(', ')}`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
