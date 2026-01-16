import { CUSTOM_DIFFICULTY_PREFIX, DifficultyLevel, VALID_DIFFICULTIES } from '@shared/constants';
import type { BaseValidationResult, CustomDifficultyString, GameDifficulty } from '@shared/types';

export function toDifficultyLevel(difficulty: GameDifficulty): DifficultyLevel {
	if (isCustomDifficulty(difficulty)) {
		return DifficultyLevel.CUSTOM;
	}

	const normalizedDifficulty = difficulty.toLowerCase();
	const matchedDifficulty = VALID_DIFFICULTIES.find(level => level.toLowerCase() === normalizedDifficulty);

	if (matchedDifficulty) {
		return matchedDifficulty;
	}

	return DifficultyLevel.MEDIUM;
}

export function restoreGameDifficulty(difficulty: DifficultyLevel, metadata?: string): GameDifficulty {
	// If it's a custom difficulty and we have metadata, try to restore the original text
	if (difficulty === DifficultyLevel.CUSTOM && metadata) {
		if (isCustomDifficulty(metadata)) {
			// isCustomDifficulty ensures metadata is CustomDifficultyString, which is part of GameDifficulty
			return metadata;
		}
	}

	// DifficultyLevel enum values are valid GameDifficulty values
	return difficulty;
}

export function isCustomDifficulty(difficulty: string): difficulty is CustomDifficultyString {
	return difficulty.startsWith(CUSTOM_DIFFICULTY_PREFIX);
}

export function isRegisteredDifficulty(difficulty: string): difficulty is DifficultyLevel {
	const normalizedDifficulty = difficulty.toLowerCase();
	// Check if any valid difficulty matches (case-insensitive)
	for (const validDiff of VALID_DIFFICULTIES) {
		if (validDiff.toLowerCase() === normalizedDifficulty) {
			return true;
		}
	}
	return false;
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
	throw new Error('Failed to create custom difficulty string');
}

export function getDifficultyDisplayText(difficulty: string, maxLength: number = 50): string {
	if (!isCustomDifficulty(difficulty)) {
		return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
	}

	const customText = extractCustomDifficultyText(difficulty);
	if (customText.length <= maxLength) {
		return customText;
	}

	return customText.substring(0, maxLength - 3) + '...';
}

export function validateCustomDifficultyText(text: string): BaseValidationResult {
	const trimmed = text.trim();

	if (trimmed.length === 0) {
		return { isValid: false, errors: ['Please enter a difficulty description'] };
	}

	if (trimmed.length < 3) {
		return {
			isValid: false,
			errors: ['Description must be at least 3 characters long'],
		};
	}

	if (trimmed.length > 200) {
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
