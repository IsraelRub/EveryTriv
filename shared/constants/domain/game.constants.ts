import type { DifficultyConfigEntry } from '@shared/types';

import { TIME_DURATIONS_SECONDS } from '../core/time.constants';
import { VALIDATION_COUNT } from '../core/validation.constants';

export const CUSTOM_DIFFICULTY_PREFIX = 'custom:';

export enum ValidateTextContext {
	TOPIC = 'topic',
	CUSTOM_DIFFICULTY = 'customDifficulty',
}

export enum DifficultyLevel {
	EASY = 'easy',
	MEDIUM = 'medium',
	HARD = 'hard',
	CUSTOM = 'custom',
}

export const DIFFICULTIES: ReadonlySet<string> = new Set<string>(Object.values(DifficultyLevel));

export enum GameMode {
	QUESTION_LIMITED = 'question-limited',
	TIME_LIMITED = 'time-limited',
	UNLIMITED = 'unlimited',
	MULTIPLAYER = 'multiplayer',
}

export const GAME_MODES: ReadonlySet<string> = new Set<string>(Object.values(GameMode));

export enum TimePeriod {
	HOURLY = 'hourly',
	DAILY = 'daily',
	WEEKLY = 'weekly',
	MONTHLY = 'monthly',
}

export enum LeaderboardPeriod {
	GLOBAL = 'global',
	WEEKLY = 'weekly',
	MONTHLY = 'monthly',
	YEARLY = 'yearly',
}

export const LEADERBOARD_PERIODS: ReadonlySet<string> = new Set<string>(Object.values(LeaderboardPeriod));

export const MAX_POINTS_PER_QUESTION = 50;

export const TIME_LIMITED_CREDITS_PER_30_SECONDS = 5;

export const DIFFICULTY_CONFIG: Record<string, DifficultyConfigEntry> = {
	[DifficultyLevel.EASY]: {
		order: 1,
		baseScore: 10,
	},
	[DifficultyLevel.MEDIUM]: {
		order: 2,
		baseScore: 20,
	},
	[DifficultyLevel.HARD]: {
		order: 3,
		baseScore: 30,
	},
	[DifficultyLevel.CUSTOM]: {
		order: 4,
	},
};

export const GAME_MODES_CONFIG = {
	[GameMode.QUESTION_LIMITED]: {
		defaults: {
			timeLimit: undefined,
			maxQuestionsPerGame: 10,
		},
		costPerQuestion: 1,
		fixedCost: undefined,
		creditsPer30Seconds: undefined,
		chargeAfterGame: false,
		hostPaysOnly: undefined,
	},
	[GameMode.TIME_LIMITED]: {
		defaults: {
			timeLimit: VALIDATION_COUNT.TIME_LIMIT.DEFAULT,
			maxQuestionsPerGame: undefined,
		},
		costPerQuestion: undefined,
		fixedCost: undefined,
		creditsPer30Seconds: TIME_LIMITED_CREDITS_PER_30_SECONDS,
		chargeAfterGame: false,
		hostPaysOnly: undefined,
	},
	[GameMode.UNLIMITED]: {
		defaults: {
			timeLimit: undefined,
			maxQuestionsPerGame: undefined,
		},
		costPerQuestion: 1,
		fixedCost: undefined,
		creditsPer30Seconds: undefined,
		chargeAfterGame: false,
		hostPaysOnly: undefined,
	},
	[GameMode.MULTIPLAYER]: {
		defaults: {
			timeLimit: TIME_DURATIONS_SECONDS.MINUTE,
			maxQuestionsPerGame: 10,
			timePerQuestion: TIME_DURATIONS_SECONDS.THIRTY_SECONDS,
		},
		costPerQuestion: 1,
		fixedCost: undefined,
		creditsPer30Seconds: undefined,
		chargeAfterGame: false,
		hostPaysOnly: true,
	},
} as const;

export const MULTIPLAYER_TIME_PER_QUESTION = GAME_MODES_CONFIG[GameMode.MULTIPLAYER].defaults.timePerQuestion;

export const DEFAULT_GAME_CONFIG = {
	defaultTopic: 'General Knowledge',
	defaultDifficulty: DifficultyLevel.MEDIUM,
	maxQuestionsPerGame: 10,
	timeLimit: TIME_DURATIONS_SECONDS.THIRTY_SECONDS,
} as const;

export enum SurpriseScope {
	TOPIC = 'topic',
	DIFFICULTY = 'difficulty',
	BOTH = 'both',
}

export const SURPRISE_SCOPE_DEFAULT = SurpriseScope.BOTH;

export const SURPRISE_SCOPES: SurpriseScope[] = Object.values(SurpriseScope);
