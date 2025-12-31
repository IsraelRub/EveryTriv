/**
 * Client Game Constants
 * Client-side constants: SCORING_DEFAULTS
 */

import { DifficultyLevel, VALIDATION_COUNT } from '@shared/constants';

export const SCORING_DEFAULTS = {
	BASE_SCORE: 100,
	STREAK: 0,
	DIFFICULTY: DifficultyLevel.EASY,
	ANSWER_COUNT: VALIDATION_COUNT.ANSWER_COUNT.DEFAULT,
	MAX_STREAK_BONUS: 10,
	STREAK_MULTIPLIER: 0.1,
	TIME_BONUS_MULTIPLIER: 0.5,
} as const;

