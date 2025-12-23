/**
 * Shared game constants for EveryTriv with enhanced mechanics
 * Used by both client and server
 *
 * @module GameConstants
 * @description Core game mechanics constants and configuration with advanced features
 */
import type { BaseGameTopicDifficulty, GameDifficulty, TriviaQuestion } from '@shared/types';

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
 * Game modes configuration
 * @constant
 * @description Complete configuration for each game mode including UI settings and defaults
 * @used_by client/src/components/game/GameMode.tsx, server/src/features/game/game.service.ts
 */
export const GAME_MODES_CONFIG = {
	[GameMode.QUESTION_LIMITED]: {
		name: 'Question Mode',
		description: 'Answer a set number of questions',
		showQuestionLimit: true,
		showTimeLimit: false,
		defaults: GAME_MODE_DEFAULTS[GameMode.QUESTION_LIMITED],
	},
	[GameMode.TIME_LIMITED]: {
		name: 'Time Attack',
		description: 'Answer as many as you can in time',
		showQuestionLimit: false,
		showTimeLimit: true,
		defaults: GAME_MODE_DEFAULTS[GameMode.TIME_LIMITED],
	},
	[GameMode.UNLIMITED]: {
		name: 'Unlimited',
		description: 'Play as long as you want',
		showQuestionLimit: false,
		showTimeLimit: false,
		defaults: GAME_MODE_DEFAULTS[GameMode.UNLIMITED],
	},
	[GameMode.MULTIPLAYER]: {
		name: 'Multiplayer',
		description: 'Compete with friends',
		showQuestionLimit: false,
		showTimeLimit: false,
		defaults: GAME_MODE_DEFAULTS[GameMode.MULTIPLAYER],
	},
} as const;

/**
 * Game client status enum
 * @enum GameClientStatus
 * @description Status of game on client side
 */
export enum GameClientStatus {
	IDLE = 'idle',
	LOADING = 'loading',
	PLAYING = 'playing',
	PAUSED = 'paused',
	COMPLETED = 'completed',
	ERROR = 'error',
}

/**
 * Player type enum
 * @enum PlayerType
 * @description Type of player in multiplayer games and game mode selection
 */
export enum PlayerType {
	HOST = 'host',
	GUEST = 'guest',
	SPECTATOR = 'spectator',
	SINGLE = 'single',
	MULTIPLAYER = 'multiplayer',
}

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

/**
 * Game state configuration
 * @constant
 * @description Configuration for game state management on client
 */
const initialClientState: {
	status: GameClientStatus;
	isPlaying: boolean;
	currentQuestion: number;
	gameQuestionCount: number;
	canGoBack: boolean;
	canGoForward: boolean;
	isGameComplete: boolean;
	questions: TriviaQuestion[];
	answers: number[];
	loading: boolean;
	error: undefined;
	trivia: undefined;
	selected: null;
	streak: number;
	favorites: BaseGameTopicDifficulty[];
} = {
	status: GameClientStatus.IDLE,
	isPlaying: false,
	currentQuestion: 0,
	gameQuestionCount: 0,
	canGoBack: false,
	canGoForward: false,
	isGameComplete: false,
	questions: [],
	answers: [],
	loading: false,
	error: undefined,
	trivia: undefined,
	selected: null,
	streak: 0,
	favorites: [],
};

const initialGameModeState: {
	currentMode: GameMode;
	currentTopic: string;
	currentDifficulty: GameDifficulty;
	currentSettings: {
		mode: GameMode;
		topic: string;
		difficulty: GameDifficulty;
		maxQuestionsPerGame: number | undefined;
		timeLimit: number | undefined;
		answerCount: number | undefined;
	};
	isLoading: boolean;
	error: string | undefined;
} = {
	currentMode: GameMode.QUESTION_LIMITED,
	currentTopic: GAME_STATE_DEFAULTS.TOPIC,
	currentDifficulty: GAME_STATE_DEFAULTS.DIFFICULTY,
	currentSettings: {
		mode: GameMode.QUESTION_LIMITED,
		topic: GAME_STATE_DEFAULTS.TOPIC,
		difficulty: GAME_STATE_DEFAULTS.DIFFICULTY,
		maxQuestionsPerGame: GAME_STATE_DEFAULTS.TOTAL_QUESTIONS,
		timeLimit: undefined,
		answerCount: undefined,
	},
	isLoading: false,
	error: undefined,
};

export const GAME_STATE_CONFIG = {
	initialClientState,
	defaults: {
		topic: GAME_STATE_DEFAULTS.TOPIC,
		difficulty: GAME_STATE_DEFAULTS.DIFFICULTY,
		maxQuestionsPerGame: GAME_STATE_DEFAULTS.TOTAL_QUESTIONS,
		timeLimit: undefined,
	},
	initialGameModeState,
} as const;

/**
 * Game status enumeration
 * @enum GameStatus
 * @description Status of game sessions
 */
export enum GameStatus {
	WAITING = 'waiting',
	IN_PROGRESS = 'in_progress',
	COMPLETED = 'completed',
	ABANDONED = 'abandoned',
}

/**
 * Trivia question source enumeration
 * @enum TriviaQuestionSource
 * @description Sources that trivia questions can come from
 */
export enum TriviaQuestionSource {
	AI = 'ai',
	USER = 'user',
	IMPORTED = 'imported',
	SEEDED = 'seeded',
	SYSTEM = 'system',
}

/**
 * Trivia question review status enumeration
 * @enum TriviaQuestionReviewStatus
 * @description Review status for trivia questions
 */
export enum TriviaQuestionReviewStatus {
	PENDING = 'pending',
	APPROVED = 'approved',
	REJECTED = 'rejected',
	FLAGGED = 'flagged',
}

/**
 * Array of all valid trivia question sources
 * @constant
 * @description Complete list of supported trivia question sources
 * @used_by server/src/features/game/logic, shared/validation
 */
export const VALID_TRIVIA_SOURCES = Object.values(TriviaQuestionSource);

/**
 * Array of all valid trivia question review statuses
 * @constant
 * @description Complete list of supported trivia question review statuses
 * @used_by server/src/features/game/logic, shared/validation
 */
export const VALID_TRIVIA_QUESTION_REVIEW_STATUSES = Object.values(TriviaQuestionReviewStatus);

/**
 * Provider status enum
 * @enum ProviderStatus
 * @description Status of AI providers
 */
export enum ProviderStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	ERROR = 'error',
	DISABLED = 'disabled',
	ENABLED = 'enabled',
	UNAVAILABLE = 'unavailable',
	HEALTHY = 'healthy',
	UNHEALTHY = 'unhealthy',
}

/**
 * Groq default model
 * @constant
 * @description Default Groq model to use when no free tier models are available
 */
export const GROQ_DEFAULT_MODEL = 'llama-3.1-8b-instant';

/**
 * Groq free tier models
 * @constant
 * @description List of Groq models available in free tier (priority 1)
 */
export const GROQ_FREE_TIER_MODELS = ['llama-3.1-8b-instant', 'gpt-oss-20b'] as const;

/**
 * Groq models configuration
 * @constant
 * @description Configuration for all available Groq models
 */
export const GROQ_MODELS: Record<
	string,
	{ priority: number; cost: number; name: string; rateLimit?: { requestsPerMinute: number; requestsPerDay?: number } }
> = {
	'llama-3.1-8b-instant': {
		priority: 1,
		cost: 0,
		name: 'llama-3.1-8b-instant',
		rateLimit: {
			requestsPerMinute: 30,
			requestsPerDay: 14400,
		},
	},
	'gpt-oss-20b': {
		priority: 1,
		cost: 0,
		name: 'gpt-oss-20b',
		rateLimit: {
			requestsPerMinute: 8,
			requestsPerDay: 1000,
		},
	},
	'gpt-oss-120b': {
		priority: 2,
		cost: 0.15,
		name: 'gpt-oss-120b',
	},
	'llama-3.1-70b-versatile': {
		priority: 2,
		cost: 0.75,
		name: 'llama-3.1-70b-versatile',
	},
} as const;
