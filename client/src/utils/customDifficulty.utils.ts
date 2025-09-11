/**
 * Custom difficulty utilities for EveryTriv
 *
 * @module CustomDifficultyUtils
 * @description Utility functions for handling custom difficulty levels
 * @used_by client/components/game, client/hooks, client/services
 */
import { DifficultyLevel } from '@shared';
import {
	extractCustomDifficultyText,
	getDifficultyDisplayText as sharedGetDifficultyDisplayText,
	isCustomDifficulty,
	validateCustomDifficultyText,
} from '@shared/validation';

export { extractCustomDifficultyText, isCustomDifficulty, validateCustomDifficultyText };

/**
 * Get display text for difficulty level (client-specific formatting)
 */
export const getDifficultyDisplayText = (difficulty: string): string => {
	return sharedGetDifficultyDisplayText(difficulty);
};

/**
 * Get icon name for difficulty level
 */
export const getDifficultyIcon = (difficulty: string): string => {
	if (isCustomDifficulty(difficulty)) {
		return DifficultyLevel.CUSTOM;
	}

	switch (difficulty.toLowerCase()) {
		case DifficultyLevel.EASY:
			return DifficultyLevel.EASY;
		case DifficultyLevel.MEDIUM:
			return DifficultyLevel.MEDIUM;
		case DifficultyLevel.HARD:
			return DifficultyLevel.HARD;
		default:
			return 'question';
	}
};

/**
 * Get difficulty level enum value from string
 */
export const getDifficultyLevel = (difficulty: string): DifficultyLevel => {
	if (isCustomDifficulty(difficulty)) {
		return DifficultyLevel.CUSTOM;
	}

	switch (difficulty.toLowerCase()) {
		case DifficultyLevel.EASY:
			return DifficultyLevel.EASY;
		case DifficultyLevel.MEDIUM:
			return DifficultyLevel.MEDIUM;
		case DifficultyLevel.HARD:
			return DifficultyLevel.HARD;
		default:
			return DifficultyLevel.EASY; // Default fallback
	}
};
