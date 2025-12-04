import type {
	AuditLogEntry,
	BusinessMetrics,
	CompleteUserAnalytics,
	CreditBalance,
	CreditPurchaseOption,
	DifficultyStats,
	SavedGameConfiguration,
	SubscriptionData,
	SubscriptionPlans,
	TopicAnalyticsRecord,
	TriviaQuestion,
	UserSearchCacheEntry,
} from '@shared/types';

import { isRecord } from '../core';

type Primitive = 'string' | 'number' | 'boolean';

type LeaderboardEntryShape = {
	userId: string;
	rank: number;
	score: number;
	percentile: number;
};

const hasPrimitive = (value: unknown, type: Primitive): boolean => typeof value === type;

const hasOptionalPrimitive = (value: unknown, type: Primitive): boolean =>
	value === null || typeof value === 'undefined' || typeof value === type;

export const createArrayGuard =
	<T>(itemGuard: (value: unknown) => value is T) =>
	(value: unknown): value is T[] =>
		Array.isArray(value) && value.every(itemGuard);

export const createNullableGuard =
	<T>(guard: (value: unknown) => value is T) =>
	(value: unknown): value is T | null =>
		value === null || guard(value);

export const createLeaderboardEntryGuard =
	<T extends LeaderboardEntryShape>() =>
	(value: unknown): value is T => {
		if (!isRecord(value)) {
			return false;
		}

		return (
			hasPrimitive(value.userId, 'string') &&
			hasPrimitive(value.rank, 'number') &&
			hasPrimitive(value.score, 'number') &&
			hasPrimitive(value.percentile, 'number')
		);
	};

export const isCreditBalanceCacheEntry = (value: unknown): value is CreditBalance => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		hasPrimitive(value.totalCredits, 'number') &&
		hasPrimitive(value.credits, 'number') &&
		hasPrimitive(value.purchasedCredits, 'number') &&
		hasPrimitive(value.freeQuestions, 'number') &&
		hasPrimitive(value.dailyLimit, 'number') &&
		hasPrimitive(value.canPlayFree, 'boolean') &&
		hasOptionalPrimitive(value.nextResetTime, 'string')
	);
};

export const isCreditPurchaseOptionArray = (value: unknown): value is CreditPurchaseOption[] => {
	return (
		Array.isArray(value) &&
		value.every(
			option =>
				isRecord(option) &&
				hasPrimitive(option.id, 'string') &&
				hasPrimitive(option.credits, 'number') &&
				hasPrimitive(option.price, 'number')
		)
	);
};

export const isSubscriptionData = (value: unknown): value is SubscriptionData => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		hasPrimitive(value.planType, 'string') &&
		hasPrimitive(value.status, 'string') &&
		hasOptionalPrimitive(value.startDate, 'string') &&
		hasOptionalPrimitive(value.endDate, 'string') &&
		hasPrimitive(value.price, 'number') &&
		Array.isArray(value.features)
	);
};

export const isSubscriptionPlans = (value: unknown): value is SubscriptionPlans => {
	if (!isRecord(value)) {
		return false;
	}

	return ['basic', 'premium', 'pro'].every(planKey => {
		const plan = value[planKey];
		if (!isRecord(plan)) {
			return false;
		}

		return hasPrimitive(plan.price, 'number') && Array.isArray(plan.features);
	});
};

export const isTriviaQuestionArray = (value: unknown): value is TriviaQuestion[] => {
	return (
		Array.isArray(value) &&
		value.every(
			question =>
				isRecord(question) &&
				hasPrimitive(question.question, 'string') &&
				Array.isArray(question.answers) &&
				hasPrimitive(question.correctAnswerIndex, 'number')
		)
	);
};

export const isTopicAnalyticsRecordArray = (value: unknown): value is TopicAnalyticsRecord[] => {
	return (
		Array.isArray(value) &&
		value.every(stat => isRecord(stat) && hasPrimitive(stat.topic, 'string') && hasPrimitive(stat.totalGames, 'number'))
	);
};

export const isDifficultyStatsRecord = (value: unknown): value is Record<string, DifficultyStats> => {
	if (!isRecord(value)) {
		return false;
	}

	return Object.values(value).every(stat => {
		if (!isRecord(stat)) {
			return false;
		}

		return (
			hasPrimitive(stat.total, 'number') &&
			hasPrimitive(stat.correct, 'number') &&
			hasOptionalPrimitive(stat.successRate, 'number')
		);
	});
};

export const isBusinessMetricsData = (value: unknown): value is BusinessMetrics => {
	if (!isRecord(value)) {
		return false;
	}

	const { revenue, users, engagement } = value;
	return (
		isRecord(revenue) &&
		isRecord(users) &&
		isRecord(engagement) &&
		hasPrimitive(revenue.total, 'number') &&
		hasPrimitive(revenue.mrr, 'number') &&
		hasPrimitive(users.total, 'number') &&
		hasPrimitive(users.active, 'number') &&
		hasPrimitive(engagement.dau, 'number') &&
		hasPrimitive(engagement.wau, 'number')
	);
};

export const isCompleteUserAnalyticsData = (value: unknown): value is CompleteUserAnalytics => {
	if (!isRecord(value)) {
		return false;
	}

	const { basic, game, performance, ranking } = value;
	return (
		isRecord(basic) &&
		hasPrimitive(basic.userId, 'string') &&
		hasPrimitive(basic.email, 'string') &&
		hasPrimitive(basic.credits, 'number') &&
		hasPrimitive(basic.purchasedCredits, 'number') &&
		isRecord(game) &&
		hasPrimitive(game.totalGames, 'number') &&
		isRecord(performance) &&
		(hasPrimitive(performance.lastPlayed, 'string') || performance.lastPlayed instanceof Date) &&
		hasPrimitive(performance.streakDays, 'number') &&
		isRecord(ranking) &&
		hasPrimitive(ranking.rank, 'number')
	);
};

export const isUserSearchCacheEntry = (value: unknown): value is UserSearchCacheEntry => {
	if (!isRecord(value) || !hasPrimitive(value.query, 'string') || !hasPrimitive(value.totalResults, 'number')) {
		return false;
	}

	if (!Array.isArray(value.results)) {
		return false;
	}

	return value.results.every(
		result =>
			isRecord(result) &&
			hasPrimitive(result.id, 'string') &&
			hasPrimitive(result.email, 'string') &&
			(hasPrimitive(result.firstName, 'string') || result.firstName === null) &&
			(hasPrimitive(result.lastName, 'string') || result.lastName === null) &&
			(hasPrimitive(result.avatar, 'string') || result.avatar === null) &&
			hasPrimitive(result.displayName, 'string')
	);
};

export const isAuditLogEntry = (value: unknown): value is AuditLogEntry => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		hasPrimitive(value.userId, 'string') &&
		hasPrimitive(value.action, 'string') &&
		hasPrimitive(value.timestamp, 'string') &&
		hasPrimitive(value.ip, 'string') &&
		hasPrimitive(value.userAgent, 'string')
	);
};

export const isSavedGameConfiguration = (value: unknown): value is SavedGameConfiguration => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		hasPrimitive(value.defaultDifficulty, 'string') &&
		hasPrimitive(value.defaultTopic, 'string') &&
		hasPrimitive(value.questionsPerRequest, 'number') &&
		hasPrimitive(value.timeLimit, 'number') &&
		hasPrimitive(value.soundEnabled, 'boolean')
	);
};

/**
 * Type guard for CreditPurchaseOption
 */
export const isCreditPurchaseOption = (value: unknown): value is CreditPurchaseOption => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		hasPrimitive(value.id, 'string') &&
		hasPrimitive(value.credits, 'number') &&
		hasPrimitive(value.price, 'number') &&
		hasPrimitive(value.priceDisplay, 'string') &&
		hasPrimitive(value.pricePerCredit, 'number') &&
		hasOptionalPrimitive(value.description, 'string') &&
		hasOptionalPrimitive(value.currency, 'string') &&
		hasOptionalPrimitive(value.bonus, 'number') &&
		hasOptionalPrimitive(value.savings, 'string') &&
		hasOptionalPrimitive(value.popular, 'boolean') &&
		hasOptionalPrimitive(value.paypalProductId, 'string') &&
		hasOptionalPrimitive(value.paypalPrice, 'string') &&
		(value.supportedMethods === undefined || Array.isArray(value.supportedMethods))
	);
};
