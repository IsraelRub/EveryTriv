/**
 * Client-specific game constants for EveryTriv
 * Client-only game configuration
 *
 * @module ClientGameConstants
 * @description Client game configuration and scoring constants
 * @used_by client/src/components/game (Game component), client/src/hooks/layers/business (useGameLogic hook)
 */

export const SCORING_DEFAULTS = {
	BASE_POINTS: 100,
	STREAK: 0,
	DIFFICULTY: 'easy' as const,
	ANSWER_COUNT: 4,
	MAX_STREAK_BONUS: 10,
	STREAK_MULTIPLIER: 0.1,
	TIME_BONUS_MULTIPLIER: 0.5,
} as const;
