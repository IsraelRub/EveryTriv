import { LeaderboardPeriod, TIME_PERIODS_MS } from '@shared/constants';

import type { GroqModelConfig } from '@internal/types';

export enum GameStatus {
	IN_PROGRESS = 'in_progress',
	COMPLETED = 'completed',
}

export const GAME_STATUSES = new Set<string>(Object.values(GameStatus));

export const LEADERBOARD_SCORE_FIELDS = {
	WEEKLY: 'weeklyScore',
	MONTHLY: 'monthlyScore',
	YEARLY: 'yearlyScore',
} as const;

export const LEADERBOARD_PERIOD_CONFIG: Record<LeaderboardPeriod, { durationMs: number | null; scoreField: string }> = {
	[LeaderboardPeriod.GLOBAL]: {
		durationMs: null,
		scoreField: LEADERBOARD_SCORE_FIELDS.WEEKLY,
	},
	[LeaderboardPeriod.WEEKLY]: {
		durationMs: TIME_PERIODS_MS.WEEK,
		scoreField: LEADERBOARD_SCORE_FIELDS.WEEKLY,
	},
	[LeaderboardPeriod.MONTHLY]: {
		durationMs: TIME_PERIODS_MS.MONTH,
		scoreField: LEADERBOARD_SCORE_FIELDS.MONTHLY,
	},
	[LeaderboardPeriod.YEARLY]: {
		durationMs: TIME_PERIODS_MS.YEAR,
		scoreField: LEADERBOARD_SCORE_FIELDS.YEARLY,
	},
};

export const GROQ_DEFAULT_MODEL = 'llama-3.1-8b-instant';

export const GROQ_FREE_TIER_MODELS = ['llama-3.1-8b-instant'] as const;

export const GROQ_MODELS: Record<string, GroqModelConfig> = {
	'llama-3.1-8b-instant': {
		priority: 1,
		cost: 0,
		name: 'llama-3.1-8b-instant',
		rateLimit: {
			requestsPerMinute: 30,
			requestsPerDay: 14400,
		},
	},
	'llama-3.3-70b-versatile': {
		priority: 2,
		cost: 0.59,
		name: 'llama-3.3-70b-versatile',
		rateLimit: {
			requestsPerMinute: 30,
			requestsPerDay: 14400,
		},
	},
	'llama-3.3-70b-specdec': {
		priority: 2,
		cost: 0.59,
		name: 'llama-3.3-70b-specdec',
		rateLimit: {
			requestsPerMinute: 30,
			requestsPerDay: 14400,
		},
	},
	'llama-3.1-70b-versatile': {
		priority: 2,
		cost: 0.75,
		name: 'llama-3.1-70b-versatile',
	},
	'gpt-oss-120b': {
		priority: 2,
		cost: 0.15,
		name: 'gpt-oss-120b',
	},
	'gpt-oss-20b': {
		priority: 3,
		cost: 0,
		name: 'gpt-oss-20b',
		rateLimit: {
			requestsPerMinute: 8,
			requestsPerDay: 1000,
		},
	},
};

export const GROQ_DEFAULT_MODEL_CONFIG: GroqModelConfig | undefined = GROQ_MODELS[GROQ_DEFAULT_MODEL];

export const GROQ_DEFAULT_REQUESTS_PER_MINUTE = GROQ_DEFAULT_MODEL_CONFIG?.rateLimit?.requestsPerMinute ?? 30;

export const GROQ_DEFAULT_TOKENS_PER_MINUTE = 30000;

export const GROQ_PROVIDER_NAME = 'Groq';

export const GROQ_PROVIDER_NAME_LOWERCASE = 'groq';

export const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_DEFAULT_TEMPERATURE = 0.7;

export const GROQ_DEFAULT_MAX_TOKENS = 512;

export const GROQ_PROVIDER_MAX_TOKENS = 8192;

export const GROQ_PROVIDER_VERSION = '1.0';
