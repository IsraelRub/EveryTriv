import { CUSTOM_DIFFICULTY_PREFIX, DIFFICULTIES, DifficultyLevel, ERROR_MESSAGES, LengthKey } from '@shared/constants';
import type { BaseValidationResult, CustomDifficultyString, GameDifficulty } from '@shared/types';

import { validateNoForbiddenWords, validateStringLength } from '../core/content.validation';

export function toDifficultyLevel(difficulty: GameDifficulty): DifficultyLevel {
	if (isCustomDifficulty(difficulty)) {
		return DifficultyLevel.CUSTOM;
	}

	const normalized = difficulty.toLowerCase();
	if (isRegisteredDifficulty(normalized)) {
		return normalized;
	}

	return DifficultyLevel.MEDIUM;
}

export function isCustomDifficulty(difficulty: string): difficulty is CustomDifficultyString {
	return difficulty.startsWith(CUSTOM_DIFFICULTY_PREFIX);
}

export function isRegisteredDifficulty(difficulty: string): difficulty is DifficultyLevel {
	return DIFFICULTIES.has(difficulty.toLowerCase());
}

export function isGameDifficulty(difficulty: unknown): difficulty is GameDifficulty {
	if (typeof difficulty !== 'string') {
		return false;
	}
	return isRegisteredDifficulty(difficulty) || isCustomDifficulty(difficulty);
}

export function extractCustomDifficultyText(difficulty: string): string {
	if (!isCustomDifficulty(difficulty)) return '';
	return difficulty.substring(CUSTOM_DIFFICULTY_PREFIX.length);
}

export function createCustomDifficulty(text: string): CustomDifficultyString {
	const trimmed = text.trim();
	// TypeScript infers the template literal type correctly when we use the const prefix
	const prefix: typeof CUSTOM_DIFFICULTY_PREFIX = CUSTOM_DIFFICULTY_PREFIX;
	const result = prefix + trimmed;
	// Verify the result is a valid custom difficulty string using type guard
	if (isCustomDifficulty(result)) {
		return result;
	}
	// This should never happen, but TypeScript needs this for type safety
	throw new Error(ERROR_MESSAGES.validation.FAILED_TO_CREATE_CUSTOM_DIFFICULTY_STRING);
}

export function validateCustomDifficultyText(text: string): BaseValidationResult {
	const lengthResult = validateStringLength(text, LengthKey.CUSTOM_DIFFICULTY);
	if (!lengthResult.isValid) return lengthResult;
	return validateNoForbiddenWords(text, 'Description');
}
