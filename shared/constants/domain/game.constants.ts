import { TIME_DURATIONS_SECONDS } from '../core/time.constants';

export const CUSTOM_DIFFICULTY_PREFIX = 'custom:';

export enum DifficultyLevel {
	EASY = 'easy',
	MEDIUM = 'medium',
	HARD = 'hard',
	CUSTOM = 'custom',
}

export const VALID_DIFFICULTIES = Object.values(DifficultyLevel);

export const VALID_DIFFICULTIES_SET = new Set<string>(VALID_DIFFICULTIES);

export enum GameMode {
	QUESTION_LIMITED = 'question-limited',
	TIME_LIMITED = 'time-limited',
	UNLIMITED = 'unlimited',
	MULTIPLAYER = 'multiplayer',
}

export const VALID_GAME_MODES = Object.values(GameMode);

export const VALID_GAME_MODES_SET = new Set<string>(VALID_GAME_MODES);

export enum TimePeriod {
	HOURLY = 'hourly',
	DAILY = 'daily',
	WEEKLY = 'weekly',
	MONTHLY = 'monthly',
}

export const VALID_TIME_PERIODS = Object.values(TimePeriod);

export const VALID_TIME_PERIODS_SET = new Set<string>(VALID_TIME_PERIODS);

export enum LeaderboardPeriod {
	GLOBAL = 'global',
	WEEKLY = 'weekly',
	MONTHLY = 'monthly',
	YEARLY = 'yearly',
}

export const VALID_LEADERBOARD_PERIODS = Object.values(LeaderboardPeriod);

export const VALID_LEADERBOARD_PERIODS_SET = new Set<string>(VALID_LEADERBOARD_PERIODS);

export const TIME_LIMITED_CREDITS_PER_30_SECONDS = 5;

export const BASE_SCORE_BY_DIFFICULTY = {
	easy: 10,
	medium: 20,
	hard: 30,
} as const;

export const CREDIT_COSTS = {
	[GameMode.QUESTION_LIMITED]: {
		costPerQuestion: 1,

		fixedCost: undefined,

		chargeAfterGame: false,
	},
	[GameMode.TIME_LIMITED]: {
		costPerQuestion: undefined,

		fixedCost: undefined,

		creditsPer30Seconds: TIME_LIMITED_CREDITS_PER_30_SECONDS,

		chargeAfterGame: false,
	},
	[GameMode.UNLIMITED]: {
		costPerQuestion: 1,

		fixedCost: undefined,

		chargeAfterGame: false,
	},
	[GameMode.MULTIPLAYER]: {
		costPerQuestion: 1,

		fixedCost: undefined,

		chargeAfterGame: false,

		hostPaysOnly: true,
	},
} as const;

export const GAME_MODE_DEFAULTS = {
	[GameMode.QUESTION_LIMITED]: {
		timeLimit: undefined,
		maxQuestionsPerGame: 10, // 10 questions
	},
	[GameMode.TIME_LIMITED]: {
		timeLimit: TIME_DURATIONS_SECONDS.MINUTE,
		maxQuestionsPerGame: undefined, // No question limit in time-limited mode
	},
	[GameMode.UNLIMITED]: {
		timeLimit: undefined,
		maxQuestionsPerGame: undefined, // No question limit in unlimited mode
	},
	[GameMode.MULTIPLAYER]: {
		timeLimit: TIME_DURATIONS_SECONDS.MINUTE,
		maxQuestionsPerGame: 10, // 10 questions
		timePerQuestion: TIME_DURATIONS_SECONDS.THIRTY_SECONDS,
	},
} as const;

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
		description: 'Play until your credits run out',
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

export enum PlayerType {
	SINGLE = 'single',
	MULTIPLAYER = 'multiplayer',
}

export const DEFAULT_GAME_CONFIG = {
	defaultDifficulty: DifficultyLevel.MEDIUM,
	defaultTopic: 'General Knowledge',
	maxQuestionsPerGame: 10,
	timeLimit: TIME_DURATIONS_SECONDS.THIRTY_SECONDS,
} as const;

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
	// Game configuration values - shared with DEFAULT_USER_PREFERENCES.game for consistency
	TOTAL_QUESTIONS: DEFAULT_GAME_CONFIG.maxQuestionsPerGame,
	DIFFICULTY: DEFAULT_GAME_CONFIG.defaultDifficulty,
	TOPIC: DEFAULT_GAME_CONFIG.defaultTopic,
} as const;

export const BASIC_TOPICS = [GAME_STATE_DEFAULTS.TOPIC, 'Science', 'History', 'Geography'] as const;

export enum GameStatus {
	IN_PROGRESS = 'in_progress',
}

export enum TriviaQuestionSource {
	AI = 'ai',
}

export const ALLOWED_TRIVIA_SOURCES = Object.values(TriviaQuestionSource);

export enum ProviderStatus {
	ACTIVE = 'active',
	HEALTHY = 'healthy',
	UNHEALTHY = 'unhealthy',
}

export const GROQ_DEFAULT_MODEL = 'gpt-oss-20b';

export const GROQ_FREE_TIER_MODELS = ['gpt-oss-20b', 'llama-3.1-8b-instant'] as const;

export const GROQ_MODELS: Record<
	string,
	{ priority: number; cost: number; name: string; rateLimit?: { requestsPerMinute: number; requestsPerDay?: number } }
> = {
	'gpt-oss-20b': {
		priority: 1,
		cost: 0,
		name: 'gpt-oss-20b',
		rateLimit: {
			requestsPerMinute: 8,
			requestsPerDay: 1000,
		},
	},
	'llama-3.1-8b-instant': {
		priority: 1,
		cost: 0,
		name: 'llama-3.1-8b-instant',
		rateLimit: {
			requestsPerMinute: 30,
			requestsPerDay: 14400,
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

export const GROQ_DEFAULT_MODEL_CONFIG = GROQ_MODELS[GROQ_DEFAULT_MODEL];

export const GROQ_DEFAULT_REQUESTS_PER_MINUTE = GROQ_DEFAULT_MODEL_CONFIG?.rateLimit?.requestsPerMinute ?? 30;

export const GROQ_DEFAULT_TOKENS_PER_MINUTE = 30000;

export const GROQ_PROVIDER_NAME = 'Groq';

export const GROQ_PROVIDER_NAME_LOWERCASE = 'groq';

export const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_DEFAULT_TEMPERATURE = 0.7;

export const GROQ_DEFAULT_MAX_TOKENS = 512;

export const GROQ_PROVIDER_MAX_TOKENS = 8192;

export const GROQ_PROVIDER_VERSION = '1.0';
