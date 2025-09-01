/**
 * Server-specific game constants for EveryTriv
 * Re-exports shared constants and adds server-only constants
 */

// Re-export shared constants
export {
	CreditOperation,
	CUSTOM_DIFFICULTY_PREFIX,
	DIFFICULTY_MULTIPLIERS,
	DifficultyLevel,
	GameMode,
	VALID_CREDIT_OPERATIONS,
	VALID_DIFFICULTIES,
	VALID_GAME_MODES,
	VALID_QUESTION_COUNTS,
} from '../../../../shared/constants/game.constants';

// Server-specific game constants
export const SERVER_GAME_CONSTANTS = {
	MAX_QUESTIONS_PER_GAME: 10,
	MIN_QUESTIONS_PER_GAME: 1,
	DEFAULT_QUESTIONS_PER_GAME: 5,
	MAX_TIME_PER_QUESTION: 300, // 5 minutes
	MIN_TIME_PER_QUESTION: 5, // 5 seconds
	MAX_QUESTIONS_PER_REQUEST: 10,
	QUESTION_GENERATION_TIMEOUT: 30000, // 30 seconds
	RATE_LIMIT: {
		QUESTIONS_PER_MINUTE: 10,
		GAMES_PER_HOUR: 100,
	},
} as const;
