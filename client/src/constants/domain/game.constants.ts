/**
 * Client Game Constants
 * Client-side constants: SCORING_DEFAULTS, POPULAR_TOPICS
 */

import { DifficultyLevel } from '@shared/constants';

export const SCORING_DEFAULTS = {
	BASE_SCORE: 100,
	STREAK: 0,
	DIFFICULTY: DifficultyLevel.EASY,
	ANSWER_COUNT: 4,
	MAX_STREAK_BONUS: 10,
	STREAK_MULTIPLIER: 0.1,
	TIME_BONUS_MULTIPLIER: 0.5,
} as const;

/**
 * Popular topics for game selection
 */
export const POPULAR_TOPICS = [
	'General Knowledge',
	'Science',
	'History',
	'Geography',
	'Sports',
	'Movies & TV',
	'Music',
	'Technology',
	'Art & Literature',
	'Food & Cooking',
] as const;
