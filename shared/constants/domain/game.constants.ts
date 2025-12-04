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
 * @used_by client/src/utils/customDifficulty.utils.ts
 */
export const CUSTOM_DIFFICULTY_PREFIX = 'custom:';

/**
 * Standard difficulty levels enumeration
 * @enum {string} DifficultyLevel
 * @description Core difficulty levels supported by the game
 * @used_by server/src/features/game/dtos/trivia-request.dto.ts, client/src/components/game, client/src/redux/features/gameModeSlice.ts
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
 * @used_by server/src/features/game/logic, client/src/components/game, shared/validation
 */
export const VALID_DIFFICULTIES = Object.values(DifficultyLevel);

/**
 * Scoring multipliers for different difficulty levels
 * @constant
 * @description Scoring multiplier based on question difficulty
 * @used_by server/src/features/game/logic, client/src/hooks/layers/business, server/src/features/analytics/analytics.service.ts
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
 * Valid requested questions options per game
 * @constant
 * @description Allowed number of questions requested in a single game session
 * @used_by shared/validation, client/forms, server/src/features/game/logic
 */
export const VALID_REQUESTED_QUESTIONS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50] as const;

/**
 * Game mode enumeration
 * @enum {string} GameMode
 * @description Different game modes available in the application
 * @used_by shared/types, client/src/redux, server/src/features/game/logic
 */
export enum GameMode {
	QUESTION_LIMITED = 'question-limited',
	TIME_LIMITED = 'time-limited',
	UNLIMITED = 'unlimited',
	MULTIPLAYER = 'multiplayer',
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
 * @used_by server/src/features/user, server/src/features/scoring, shared/validation
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

/**
 * Sort Order Enum
 * @enum SortOrder
 * @description Sort order options for queries and lists
 * @used_by server/src/features/analytics, server/src/features/leaderboard, shared/types
 */
export enum SortOrder {
	ASC = 'asc',
	DESC = 'desc',
}

/**
 * Array of all valid sort orders
 * @constant
 * @description Complete list of supported sort orders
 * @used_by server/src/validation, client/forms, server/src/features/analytics
 */
export const VALID_SORT_ORDERS = Object.values(SortOrder);

/**
 * Time Period Enum
 * @enum TimePeriod
 * @description Time period options for analytics grouping
 * @used_by server/src/features/analytics, shared/types
 */
export enum TimePeriod {
	HOURLY = 'hourly',
	DAILY = 'daily',
	WEEKLY = 'weekly',
	MONTHLY = 'monthly',
}

/**
 * Array of all valid time periods
 * @constant
 * @description Complete list of supported time periods
 * @used_by server/src/validation, client/forms, server/src/features/analytics
 */
export const VALID_TIME_PERIODS = Object.values(TimePeriod);

/**
 * Leaderboard Period Enum
 * @enum LeaderboardPeriod
 * @description Leaderboard period options
 * @used_by server/src/features/leaderboard, shared/types
 */
export enum LeaderboardPeriod {
	GLOBAL = 'global',
	WEEKLY = 'weekly',
	MONTHLY = 'monthly',
	YEARLY = 'yearly',
	TOPIC = 'topic',
}

/**
 * Array of all valid leaderboard periods
 * @constant
 * @description Complete list of supported leaderboard periods
 * @used_by server/src/validation, client/forms, server/src/features/leaderboard
 */
export const VALID_LEADERBOARD_PERIODS = Object.values(LeaderboardPeriod);

/**
 * Event Result Enum
 * @enum EventResult
 * @description Event result options for analytics tracking
 * @used_by server/src/features/analytics, shared/types
 */
export enum EventResult {
	SUCCESS = 'success',
	FAILURE = 'failure',
	ERROR = 'error',
}

/**
 * Array of all valid event results
 * @constant
 * @description Complete list of supported event results
 * @used_by server/src/validation, client/forms, server/src/features/analytics
 */
export const VALID_EVENT_RESULTS = Object.values(EventResult);

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
 * Game mode default settings
 * @constant
 * @description Default settings for each game mode
 * @used_by client/src/constants/game/game-mode.constants.ts, server/src/features/game/game.service.ts
 */
export const GAME_MODE_DEFAULTS = {
	[GameMode.QUESTION_LIMITED]: {
		timeLimit: undefined,
		maxQuestionsPerGame: 10, // 10 questions
	},
	[GameMode.TIME_LIMITED]: {
		timeLimit: 60, // 1 minute
		maxQuestionsPerGame: undefined, // No question limit in time-limited mode
	},
	[GameMode.UNLIMITED]: {
		timeLimit: undefined,
		maxQuestionsPerGame: undefined, // No question limit in unlimited mode
	},
	[GameMode.MULTIPLAYER]: {
		timeLimit: 60, // 1 minute
		maxQuestionsPerGame: 10, // 10 questions
	},
} as const;

/**
 * Game state constants
 * @constant
 * @description Default game state values and configuration
 * @used_by client/src/constants/game-state.constants.ts, client/src/hooks/layers/business
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
	DIFFICULTY: DifficultyLevel.EASY,
	TOPIC: 'General Knowledge',
} as const;
