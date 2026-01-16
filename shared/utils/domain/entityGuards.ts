import { VALIDATORS } from '@shared/constants';
import type {
	AuditLogEntry,
	BasicValue,
	BusinessMetrics,
	CompleteUserAnalytics,
	CreditBalance,
	CreditPurchaseOption,
	DifficultyStats,
	LeaderboardEntry,
	SavedGameConfiguration,
	TopicAnalyticsRecord,
	TriviaQuestion,
	TypeGuard,
	UserProgressData,
	UserSearchCacheEntry,
} from '@shared/types';
import { isRecord } from '@shared/utils';
import { isGameDifficulty } from '@shared/validation';

// Type guard for required basic values (string, number, boolean).
// Uses VALIDATORS for consistent validation (includes Number.isFinite check for numbers).
// Additional checks for numbers: !Number.isNaN() to prevent NaN values.
const hasBasicValue = (value: unknown, type: BasicValue): boolean => {
	switch (type) {
		case 'string':
			return VALIDATORS.string(value);
		case 'number':
			return VALIDATORS.number(value) && !Number.isNaN(value) && Number.isFinite(value);
		case 'boolean':
			return VALIDATORS.boolean(value);
		default:
			return false;
	}
};

// Type guard for optional basic values (string, number, boolean, null, undefined).
// Uses VALIDATORS for consistent validation (includes Number.isFinite check for numbers).
// Additional checks for numbers: !Number.isNaN() to prevent NaN values.
const hasOptionalBasicValue = (value: unknown, type: BasicValue): boolean => {
	if (value == null) {
		return true;
	}
	return hasBasicValue(value, type);
};

export const createArrayGuard =
	<T>(itemGuard: TypeGuard<T>): TypeGuard<T[]> =>
	(value: unknown): value is T[] =>
		Array.isArray(value) && value.every(itemGuard);

export const createNullableGuard =
	<T>(guard: TypeGuard<T>): TypeGuard<T | null> =>
	(value: unknown): value is T | null =>
		value == null || guard(value);

export const createLeaderboardEntryGuard =
	<T extends LeaderboardEntry>() =>
	(value: unknown): value is T => {
		if (!isRecord(value)) {
			return false;
		}

		return (
			hasBasicValue(value.userId, 'string') &&
			hasBasicValue(value.rank, 'number') &&
			hasBasicValue(value.score, 'number') &&
			hasBasicValue(value.percentile, 'number')
		);
	};

export const isCreditBalanceCacheEntry = (value: unknown): value is CreditBalance => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		hasBasicValue(value.totalCredits, 'number') &&
		hasBasicValue(value.credits, 'number') &&
		hasBasicValue(value.purchasedCredits, 'number') &&
		hasBasicValue(value.freeQuestions, 'number') &&
		hasBasicValue(value.dailyLimit, 'number') &&
		hasBasicValue(value.canPlayFree, 'boolean') &&
		hasOptionalBasicValue(value.nextResetTime, 'string')
	);
};

export const isCreditPurchaseOption = (value: unknown): value is CreditPurchaseOption => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		hasBasicValue(value.id, 'string') &&
		hasBasicValue(value.credits, 'number') &&
		hasBasicValue(value.price, 'number') &&
		hasBasicValue(value.priceDisplay, 'string') &&
		hasBasicValue(value.pricePerCredit, 'number') &&
		hasOptionalBasicValue(value.description, 'string') &&
		hasOptionalBasicValue(value.currency, 'string') &&
		hasOptionalBasicValue(value.bonus, 'number') &&
		hasOptionalBasicValue(value.savings, 'string') &&
		hasOptionalBasicValue(value.popular, 'boolean') &&
		hasOptionalBasicValue(value.paypalProductId, 'string') &&
		hasOptionalBasicValue(value.paypalPrice, 'string') &&
		(value.supportedMethods === undefined || Array.isArray(value.supportedMethods))
	);
};

export const isCreditPurchaseOptionArray = createArrayGuard(isCreditPurchaseOption);

const isTopicAnalyticsRecord = (value: unknown): value is TopicAnalyticsRecord => {
	return isRecord(value) && hasBasicValue(value.topic, 'string') && hasBasicValue(value.totalGames, 'number');
};

export const isTopicAnalyticsRecordArray = createArrayGuard(isTopicAnalyticsRecord);

export const isTriviaQuestionArray = (value: unknown): value is TriviaQuestion[] => {
	return (
		Array.isArray(value) &&
		value.every(
			question =>
				isRecord(question) &&
				hasBasicValue(question.question, 'string') &&
				Array.isArray(question.answers) &&
				hasBasicValue(question.correctAnswerIndex, 'number') &&
				hasBasicValue(question.topic, 'string') &&
				hasBasicValue(question.difficulty, 'string')
		)
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
			hasBasicValue(stat.total, 'number') &&
			hasBasicValue(stat.correct, 'number') &&
			hasOptionalBasicValue(stat.successRate, 'number')
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
		hasBasicValue(revenue.total, 'number') &&
		hasBasicValue(revenue.mrr, 'number') &&
		hasBasicValue(users.total, 'number') &&
		hasBasicValue(users.active, 'number') &&
		hasBasicValue(engagement.dau, 'number') &&
		hasBasicValue(engagement.wau, 'number')
	);
};

export const isCompleteUserAnalyticsData = (value: unknown): value is CompleteUserAnalytics => {
	if (!isRecord(value)) {
		return false;
	}

	const { basic, game, performance, ranking } = value;
	return (
		isRecord(basic) &&
		hasBasicValue(basic.userId, 'string') &&
		hasBasicValue(basic.email, 'string') &&
		hasBasicValue(basic.credits, 'number') &&
		hasBasicValue(basic.purchasedCredits, 'number') &&
		isRecord(game) &&
		hasBasicValue(game.totalGames, 'number') &&
		isRecord(performance) &&
		(hasBasicValue(performance.lastPlayed, 'string') || VALIDATORS.date(performance.lastPlayed)) &&
		hasBasicValue(performance.streakDays, 'number') &&
		isRecord(ranking) &&
		hasBasicValue(ranking.rank, 'number')
	);
};

export const isUserSearchCacheEntry = (value: unknown): value is UserSearchCacheEntry => {
	if (!isRecord(value) || !hasBasicValue(value.query, 'string') || !hasBasicValue(value.totalResults, 'number')) {
		return false;
	}

	if (!Array.isArray(value.results)) {
		return false;
	}

	return value.results.every(
		result =>
			isRecord(result) &&
			hasBasicValue(result.id, 'string') &&
			hasBasicValue(result.email, 'string') &&
			hasOptionalBasicValue(result.firstName, 'string') &&
			hasOptionalBasicValue(result.lastName, 'string') &&
			hasOptionalBasicValue(result.avatar, 'number') &&
			hasBasicValue(result.displayName, 'string')
	);
};

export const isAuditLogEntry = (value: unknown): value is AuditLogEntry => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		hasBasicValue(value.userId, 'string') &&
		hasBasicValue(value.action, 'string') &&
		hasBasicValue(value.timestamp, 'string') &&
		hasBasicValue(value.ip, 'string') &&
		hasBasicValue(value.userAgent, 'string')
	);
};

export const isSavedGameConfiguration = (value: unknown): value is SavedGameConfiguration => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		isGameDifficulty(value.defaultDifficulty) &&
		hasBasicValue(value.defaultTopic, 'string') &&
		hasBasicValue(value.questionsPerRequest, 'number') &&
		hasBasicValue(value.timeLimit, 'number') &&
		hasBasicValue(value.soundEnabled, 'boolean')
	);
};

export const isUserProgressData = (value: unknown): value is UserProgressData => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		hasBasicValue(value.userId, 'string') &&
		hasBasicValue(value.topic, 'string') &&
		hasBasicValue(value.correctAnswers, 'number') &&
		hasBasicValue(value.totalQuestionsAnswered, 'number') &&
		hasBasicValue(value.averageResponseTime, 'number') &&
		hasBasicValue(value.lastPlayed, 'string') &&
		hasBasicValue(value.difficulty, 'string')
	);
};
