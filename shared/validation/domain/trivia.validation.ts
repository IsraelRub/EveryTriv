import { VALID_DIFFICULTIES } from '@shared/constants';
import type { GameDifficulty, ValidationResult } from '@shared/types';

import { validateTopicLength } from '../core/topic.validation';
import {
	extractCustomDifficultyText,
	isCustomDifficulty,
	isRegisteredDifficulty,
	validateCustomDifficultyText,
} from './difficulty.validation';

export function validateTriviaRequest(topic: string, difficulty: GameDifficulty): ValidationResult {
	const errors: string[] = [];

	// Validate topic using shared function
	const topicValidation = validateTopicLength(topic);
	if (!topicValidation.isValid) {
		errors.push(...topicValidation.errors);
	}

	// Validate difficulty
	if (!difficulty) {
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
			errors.push(`Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
