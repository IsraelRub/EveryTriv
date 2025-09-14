/**
 * Shared game constants for EveryTriv with enhanced mechanics
 * Used by both client and server
 *
 * @module GameConstants
 * @description Core game mechanics constants and configuration with advanced features
 */

/**
 * Prefix for custom difficulty levels
 * @constant
 * @description Used to identify custom difficulty strings
 * @used_by server/src/features/game/logic/game-validation.service.ts, client/src/utils/customDifficulty.utils.ts
 */
export const CUSTOM_DIFFICULTY_PREFIX = 'custom:';

/**
 * Standard difficulty levels enumeration
 * @enum {string} DifficultyLevel
 * @description Core difficulty levels supported by the game
 * @used_by server/src/features/game/dtos/trivia-request.dto.ts, client/src/components/game/TriviaForm.tsx, client/src/redux/features/gameModeSlice.ts
 */
export enum DifficultyLevel {
	EASY = 'easy',
	MEDIUM = 'medium',
	HARD = 'hard',
	CUSTOM = 'custom',
}

/**
 * Array of all valid difficulty levels
 * @constant
 * @description Complete list of supported difficulty levels
 * @used_by server/src/features/game/logic/game-validation.service.ts, client/src/components/game/TriviaForm.tsx, shared/validation/difficulty.validation.ts
 */
export const VALID_DIFFICULTIES = Object.values(DifficultyLevel);

/**
 * Scoring multipliers for different difficulty levels
 * @constant
 * @description Points multiplier based on question difficulty
 * @used_by server/src/features/game/logic/scoring/scoring.service.ts, client/src/hooks/layers/business/useGameLogic.ts, server/src/features/analytics/analytics.service.ts
 */
export const DIFFICULTY_MULTIPLIERS = {
	[DifficultyLevel.EASY]: 1,
	[DifficultyLevel.MEDIUM]: 1.5,
	[DifficultyLevel.HARD]: 2,
	CUSTOM_DEFAULT: 1.3,
	BONUS_MULTIPLIER: 1.2,
	STREAK_MULTIPLIER: 1.1,
	PERFECT_SCORE_MULTIPLIER: 1.5,
} as const;

/**
 * Custom difficulty multipliers based on detected keywords
 * @constant
 * @description Advanced multipliers for specific custom difficulty types
 * @used_by server/src/features/game/logic, shared/utils, server/src/features/analytics
 */
export const CUSTOM_DIFFICULTY_MULTIPLIERS = {
	[DifficultyLevel.EASY]: 1.0,
	[DifficultyLevel.MEDIUM]: 1.5,
	[DifficultyLevel.HARD]: 2.0,
	[DifficultyLevel.CUSTOM]: 1.3,
} as const;

/**
 * Valid question count options per game
 * @constant
 * @description Allowed number of questions in a single game session
 * @used_by shared/validation, client/forms, server/src/features/game/logic
 */
export const VALID_QUESTION_COUNTS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50] as const;

/**
 * Game mode enumeration
 * @enum {string} GameMode
 * @description Different game modes available in the application
 * @used_by shared/types, client/redux, server/src/features/game/logic
 */
export enum GameMode {
	QUESTION_LIMITED = 'question-limited',
	TIME_LIMITED = 'time-limited',
	UNLIMITED = 'unlimited',
}

/**
 * Array of all valid game modes
 * @constant
 * @description Complete list of supported game modes
 * @used_by shared/validation, client/forms, server/src/validation
 */
export const VALID_GAME_MODES = Object.values(GameMode);

/**
 * Credit operation types enumeration
 * @enum {string} CreditOperation
 * @description Operations that can be performed on user credits
 * @used_by server/src/features/user, server/src/features/points, shared/validation
 */
export enum CreditOperation {
	ADD = 'add',
	DEDUCT = 'deduct',
	SET = 'set',
}

/**
 * Array of all valid credit operations
 * @constant
 * @description Complete list of supported credit operations
 * @used_by shared/validation, server/src/validation, client/forms
 */
export const VALID_CREDIT_OPERATIONS = Object.values(CreditOperation);

// Custom difficulty keywords for detection
export const CUSTOM_DIFFICULTY_KEYWORDS = {
	LEVELS: ['beginner', 'elementary', 'basic', 'intermediate', 'advanced', 'expert', 'master', 'professional'],
	DIFFICULTY_WORDS: ['easy', 'medium', 'hard', 'difficult', 'challenging', 'simple', 'complex', 'basic', 'advanced'],
	TOPIC_SPECIFIC: [
		'history',
		'science',
		'math',
		'geography',
		'literature',
		'art',
		'music',
		'sports',
		'technology',
		'politics',
	],
} as const;

/**
 * Game state constants
 * @constant
 * @description Default game state values and configuration
 * @used_by client/src/constants/game-state.constants.ts, client/src/hooks/layers/business/useGameLogic.ts
 */
export const GAME_STATE_DEFAULTS = {
	SCORE: 0,
	STREAK: 0,
	QUESTIONS_ANSWERED: 0,
	QUESTIONS_CORRECT: 0,
	QUESTIONS_INCORRECT: 0,
	TIME_ELAPSED: 0,
	IS_GAME_ACTIVE: false,
	IS_GAME_PAUSED: false,
	IS_GAME_OVER: false,
	QUESTION_INDEX: 0,
	TOTAL_QUESTIONS: 10, // Default for question-limited mode
	TIME_LIMIT: 300, // 5 minutes default for time-limited mode
	DIFFICULTY: DifficultyLevel.EASY,
	TOPIC: 'General Knowledge',
} as const;
