import { CUSTOM_DIFFICULTY_PREFIX, DIFFICULTIES, DifficultyLevel, ERROR_MESSAGES } from '@shared/constants';
import type { BaseValidationResult, CustomDifficultyString, GameDifficulty } from '@shared/types';

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

export function isValidDifficulty(difficulty: string): boolean {
	return isRegisteredDifficulty(difficulty) || isCustomDifficulty(difficulty);
}

export function isGameDifficulty(difficulty: unknown): difficulty is GameDifficulty {
	if (typeof difficulty !== 'string') {
		return false;
	}
	return isValidDifficulty(difficulty);
}

export function extractCustomDifficultyText(difficulty: string): string {
	if (!isCustomDifficulty(difficulty)) return '';
	return difficulty.substring(CUSTOM_DIFFICULTY_PREFIX.length);
}

export function createCustomDifficulty(text: string): CustomDifficultyString {
	const trimmed = text.trim();
	// TypeScript infers the template literal type correctly when we use the const prefix
	const prefix: typeof CUSTOM_DIFFICULTY_PREFIX = CUSTOM_DIFFICULTY_PREFIX;
	const result = `${prefix}${trimmed}`;
	// Verify the result is a valid custom difficulty string using type guard
	if (isCustomDifficulty(result)) {
		return result;
	}
	// This should never happen, but TypeScript needs this for type safety
	throw new Error(ERROR_MESSAGES.validation.FAILED_TO_CREATE_CUSTOM_DIFFICULTY_STRING);
}

export function validateCustomDifficultyText(text: string): BaseValidationResult {
	const trimmed = text.trim();

	if (trimmed.length === 0) {
		return { isValid: false, errors: ['Please enter a difficulty description'] };
	} else if (trimmed.length < 3) {
		return {
			isValid: false,
			errors: ['Description must be at least 3 characters long'],
		};
	} else if (trimmed.length > 200) {
		return {
			isValid: false,
			errors: ['Description must be less than 200 characters'],
		};
	}

	const forbiddenWords = ['spam', 'test', 'xxx'];
	const lowerText = trimmed.toLowerCase();
	for (const word of forbiddenWords) {
		if (lowerText.includes(word)) {
			return {
				isValid: false,
				errors: ['Please enter a meaningful difficulty description'],
			};
		}
	}

	return { isValid: true, errors: [] };
}
