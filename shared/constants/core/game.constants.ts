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
 * @used_by server: server/src/features/game/logic/game-validation.service.ts (validateDifficulty), client: client/src/utils/customDifficulty.utils.ts (createCustomDifficulty, extractCustomDifficultyText)
 */
export const CUSTOM_DIFFICULTY_PREFIX = 'custom:';

/**
 * Standard difficulty levels enumeration
 * @enum {string} DifficultyLevel
 * @description Core difficulty levels supported by the game
 * @used_by server: server/src/features/game/dtos/trivia-request.dto.ts (TriviaRequestDto.difficulty), client: client/src/components/game/TriviaForm.tsx (difficulty selection), client/src/redux/features/gameModeSlice.ts (difficultyLevel state)
 */
export enum DifficultyLevel {
	/** Beginner level questions */
	EASY = 'easy',
	/** Intermediate level questions */
	MEDIUM = 'medium',
	/** Advanced level questions */
	HARD = 'hard',
	/** User-defined custom difficulty */
	CUSTOM = 'custom',
}

/**
 * Array of all valid difficulty levels
 * @constant
 * @description Complete list of supported difficulty levels
 * @used_by server: server/src/features/game/logic/game-validation.service.ts (validateDifficulty), client: client/src/components/game/TriviaForm.tsx (difficulty dropdown options), shared/validation/difficulty.validation.ts (isValidDifficulty)
 */
export const VALID_DIFFICULTIES = Object.values(DifficultyLevel);

/**
 * Scoring multipliers for different difficulty levels
 * @constant
 * @description Points multiplier based on question difficulty
 * @used_by server: server/src/features/game/logic/scoring/scoring.service.ts (calculatePoints), client: client/src/hooks/layers/business/useGameLogic.ts (score calculation), server/src/features/analytics/analytics.service.ts (performance metrics)
 */
export const DIFFICULTY_MULTIPLIERS = {
	/** Easy questions multiplier */
	[DifficultyLevel.EASY]: 1,
	/** Medium questions multiplier */
	[DifficultyLevel.MEDIUM]: 1.5,
	/** Hard questions multiplier */
	[DifficultyLevel.HARD]: 2,
	/** Default custom difficulty multiplier */
	CUSTOM_DEFAULT: 1.3,
	/** Enhanced multipliers with bonus system */
	BONUS_MULTIPLIER: 1.2,
	STREAK_MULTIPLIER: 1.1,
	PERFECT_SCORE_MULTIPLIER: 1.5,
} as const;

/**
 * Custom difficulty multipliers based on detected keywords
 * @constant
 * @description Advanced multipliers for specific custom difficulty types
 * @used_by server/game/logic, shared/utils, server/analytics
 */
export const CUSTOM_DIFFICULTY_MULTIPLIERS = {
	/** Easy level multiplier */
	[DifficultyLevel.EASY]: 1.0,
	/** Medium level multiplier */
	[DifficultyLevel.MEDIUM]: 1.5,
	/** Hard level multiplier */
	[DifficultyLevel.HARD]: 2.0,
	/** Custom difficulty default multiplier */
	[DifficultyLevel.CUSTOM]: 1.3,
} as const;

/**
 * Valid question count options per game
 * @constant
 * @description Allowed number of questions in a single game session
 * @used_by shared/validation, client/forms, server/game/logic
 */
export const VALID_QUESTION_COUNTS = [3, 4, 5] as const;

/**
 * Game mode enumeration
 * @enum {string} GameMode
 * @description Different game modes available in the application
 * @used_by shared/types, client/redux, server/game/logic
 */
export enum GameMode {
	/** Game with limited number of questions */
	QUESTION_LIMITED = 'question-limited',
	/** Time-limited game session */
	TIME_LIMITED = 'time-limited',
	/** Unlimited questions mode (no scoring) */
	UNLIMITED = 'unlimited',
}

/**
 * Array of all valid game modes
 * @constant
 * @description Complete list of supported game modes
 * @used_by shared/validation, client/forms, server/validation
 */
export const VALID_GAME_MODES = Object.values(GameMode);

/**
 * Credit operation types enumeration
 * @enum {string} CreditOperation
 * @description Operations that can be performed on user credits
 * @used_by server/user/service, server/points/service, shared/validation
 */
export enum CreditOperation {
	/** Add credits to user account */
	ADD = 'add',
	/** Deduct credits from user account */
	DEDUCT = 'deduct',
	/** Set absolute credit amount */
	SET = 'set',
}

/**
 * Array of all valid credit operations
 * @constant
 * @description Complete list of supported credit operations
 * @used_by shared/validation, server/validation, client/forms
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
	CURRENT_QUESTION_INDEX: 0,
	TOTAL_QUESTIONS: 10, // Default for question-limited mode
	TIME_LIMIT: 300, // 5 minutes default for time-limited mode
	DIFFICULTY: DifficultyLevel.EASY,
	TOPIC: 'General Knowledge',
} as const;
