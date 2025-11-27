/**
 * Comprehensive difficulty validation and utilities
 *
 * @module DifficultyValidation
 * @description Custom difficulty validation and utility functions for game difficulty management
 * @author EveryTriv Team
 * @used_by client/src/utils/customDifficulty.utils.ts, shared/validation
 */
import { CUSTOM_DIFFICULTY_PREFIX, DifficultyLevel, VALID_DIFFICULTIES } from '@shared/constants';
import type { BaseValidationResult, GameDifficulty } from '@shared/types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts GameDifficulty to DifficultyLevel for database storage
 * Custom difficulties are converted to DifficultyLevel.CUSTOM
 *
 * @param difficulty The difficulty to convert (GameDifficulty)
 * @returns DifficultyLevel The corresponding difficulty level for storage
 * @description Converts both standard difficulty levels and custom difficulty strings to DifficultyLevel enum
 */
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

/**
 * Checks if the provided difficulty string represents a custom difficulty
 *
 * @param difficulty The difficulty string to check
 * @returns boolean True if the difficulty is custom, false otherwise
 * @description Determines if difficulty starts with the custom difficulty prefix
 */
export function isCustomDifficulty(difficulty: string): boolean {
	return difficulty.startsWith(CUSTOM_DIFFICULTY_PREFIX);
}

/**
 * Checks if the provided difficulty matches a registered difficulty level
 *
 * @param difficulty The difficulty string to check
 * @returns boolean True if the difficulty matches a registered difficulty
 * @description Determines if difficulty corresponds to one of the predefined levels
 */
export function isRegisteredDifficulty(difficulty: string): difficulty is DifficultyLevel {
	const normalizedDifficulty = difficulty.toLowerCase();
	return VALID_DIFFICULTIES.some(validDiff => validDiff.toLowerCase() === normalizedDifficulty);
}

/**
 * Checks if a difficulty value is valid (registered or custom)
 *
 * @param difficulty The difficulty string to validate
 * @returns boolean True if the difficulty is registered or a valid custom difficulty
 * @description Validates that a difficulty is either one of the predefined levels or a custom difficulty
 */
export function isValidDifficulty(difficulty: string): boolean {
	return isRegisteredDifficulty(difficulty) || isCustomDifficulty(difficulty);
}

/**
 * Extracts the custom difficulty text from a full difficulty string
 *
 * @param difficulty The full difficulty string to extract from
 * @returns string The custom difficulty text without the prefix
 * @description Removes the custom difficulty prefix to get the user-defined text
 */
export function extractCustomDifficultyText(difficulty: string): string {
	if (!isCustomDifficulty(difficulty)) return '';
	return difficulty.substring(CUSTOM_DIFFICULTY_PREFIX.length);
}

/**
 * Creates a custom difficulty string from user input text
 *
 * @param text The user input text for custom difficulty
 * @returns string The formatted custom difficulty string with prefix
 * @description Adds the custom difficulty prefix to user input text
 */
export function createCustomDifficulty(text: string): string {
	return `${CUSTOM_DIFFICULTY_PREFIX}${text.trim()}`;
}

/**
 * Gets display text for difficulty with length constraints
 *
 * @param difficulty The difficulty string to format for display
 * @param maxLength Maximum length for display text (defaults to 50)
 * @returns string Formatted display text for the difficulty
 * @description Formats difficulty text for UI display with truncation for long custom difficulties
 */
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

/**
 * Gets the score multiplier based on mapped difficulty level
 *
 * @param mappedDifficulty The mapped difficulty level
 * @returns number The score multiplier for the difficulty level
 * @description Returns appropriate score multiplier for different difficulty levels
 */
export function getCustomDifficultyMultiplier(mappedDifficulty: DifficultyLevel): number {
	switch (mappedDifficulty) {
		case DifficultyLevel.EASY:
			return 1;
		case DifficultyLevel.MEDIUM:
			return 1.5;
		case DifficultyLevel.HARD:
			return 2;
		default:
			return 1.3;
	}
}

/**
 * Normalizes custom difficulty text for consistent processing
 *
 * @param text The text to normalize
 * @returns string Normalized text with consistent formatting
 * @description Cleans and standardizes custom difficulty text for processing
 */
export function normalizeCustomDifficulty(text: string): string {
	return text
		.trim()
		.replace(/\s+/g, ' ')
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.trim();
}

/**
 * Checks if custom difficulty text contains meaningful content
 *
 * @param text The text to validate for meaningful content
 * @returns boolean True if the text contains meaningful content
 * @description Validates that custom difficulty text has substantial content beyond common words
 */
export function hasValidCustomDifficultyContent(text: string): boolean {
	const normalized = normalizeCustomDifficulty(text);

	const meaningfulWords = normalized
		.split(' ')
		.filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'that'].includes(word));

	return meaningfulWords.length > 0;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates custom difficulty text input for format and content
 *
 * @param text The custom difficulty text to validate
 * @returns SimpleValidationResult containing validation result and error messages if invalid
 * @description Performs comprehensive validation of custom difficulty text including length, content, and forbidden words
 */
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
