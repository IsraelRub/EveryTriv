/**
 * Server-specific game constants for EveryTriv
 * Server-only game configuration
 */

// Server-specific game constants
export const SERVER_GAME_CONSTANTS = {
	MAX_QUESTIONS_PER_GAME: 10,
	MIN_QUESTIONS_PER_GAME: 1,
	DEFAULT_QUESTIONS_PER_GAME: 5,
	MAX_TIME_PER_QUESTION: 300, // 5 minutes
	MIN_TIME_PER_QUESTION: 5, // 5 seconds
	MAX_QUESTIONS_PER_REQUEST: 10,
	RATE_LIMIT: {
		QUESTIONS_PER_MINUTE: 10,
		GAMES_PER_HOUR: 100,
	},
} as const;
