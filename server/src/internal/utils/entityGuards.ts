import type {
	AdminGameStatistics,
	AnalyticsResponse,
	BasicValue,
	BusinessMetrics,
	CompleteUserAnalytics,
	CreditBalance,
	CreditPurchaseOption,
	DifficultyStats,
	TopicAnalyticsRecord,
	TriviaQuestion,
	TypeGuard,
	UnifiedUserAnalyticsResponse,
	UserSearchCacheEntry,
	UserTrendPoint,
} from '@shared/types';
import { isRecord } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { UNIFIED_SECTION_KEYS } from '@internal/constants';

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
		hasOptionalBasicValue(value.nextResetTime, 'string') &&
		hasOptionalBasicValue(value.nextGrantedCreditsRefillAt, 'string')
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
			hasBasicValue(result.displayName, 'string') &&
			hasOptionalBasicValue(result.role, 'string') &&
			hasOptionalBasicValue(result.createdAt, 'string') &&
			hasOptionalBasicValue(result.lastLogin, 'string')
	);
};

const isCountRecord = (v: unknown): v is Record<string, number> =>
	isRecord(v) && Object.values(v).every(val => VALIDATORS.number(val) && !Number.isNaN(val) && Number.isFinite(val));

export const isAdminGameStatistics = (value: unknown): value is AdminGameStatistics => {
	if (!isRecord(value)) {
		return false;
	}
	return (
		hasBasicValue(value.totalGames, 'number') &&
		hasBasicValue(value.totalQuestionsAnswered, 'number') &&
		hasBasicValue(value.correctAnswers, 'number') &&
		hasBasicValue(value.accuracy, 'number') &&
		hasBasicValue(value.activePlayers24h, 'number') &&
		hasBasicValue(value.averageScore, 'number') &&
		hasBasicValue(value.bestScore, 'number') &&
		(isCountRecord(value.topics) || (isRecord(value.topics) && Object.keys(value.topics).length === 0)) &&
		(isCountRecord(value.difficultyDistribution) ||
			(isRecord(value.difficultyDistribution) && Object.keys(value.difficultyDistribution).length === 0)) &&
		(value.lastActivity === null || hasBasicValue(value.lastActivity, 'string'))
	);
};

const isUserTrendPoint = (value: unknown): value is UserTrendPoint => {
	if (!isRecord(value)) {
		return false;
	}
	return (
		hasBasicValue(value.date, 'string') &&
		hasBasicValue(value.score, 'number') &&
		hasBasicValue(value.successRate, 'number') &&
		hasBasicValue(value.totalQuestionsAnswered, 'number') &&
		hasBasicValue(value.correctAnswers, 'number') &&
		hasOptionalBasicValue(value.topic, 'string') &&
		hasOptionalBasicValue(value.difficulty, 'string')
	);
};

export const isUserTrendPointArray = createArrayGuard(isUserTrendPoint);

export const isUnifiedUserAnalyticsResponse = (value: unknown): value is UnifiedUserAnalyticsResponse => {
	if (!isRecord(value)) {
		return false;
	}
	const keys = Object.keys(value);
	if (keys.length > 0 && !keys.every(k => UNIFIED_SECTION_KEYS.has(k))) {
		return false;
	}
	if (value.statistics !== undefined) {
		const s = value.statistics;
		if (!isRecord(s) || !hasBasicValue(s.totalGames, 'number') || !hasBasicValue(s.successRate, 'number')) {
			return false;
		}
	}
	if (value.trends !== undefined) {
		if (!isUserTrendPointArray(value.trends)) {
			return false;
		}
	}
	if (value.performance !== undefined) {
		const p = value.performance;
		if (!isRecord(p) || !hasBasicValue(p.streakDays, 'number')) {
			return false;
		}
	}
	return true;
};

export const isAnalyticsResponseUserTrendPointArray = (
	value: unknown
): value is AnalyticsResponse<UserTrendPoint[]> => {
	if (!isRecord(value) || !('data' in value) || !('timestamp' in value)) {
		return false;
	}
	return (
		hasBasicValue(value.timestamp, 'string') &&
		Array.isArray(value.data) &&
		createArrayGuard(isUserTrendPoint)(value.data)
	);
};

export const isAnalyticsResponseUnifiedUserAnalytics = (
	value: unknown
): value is AnalyticsResponse<UnifiedUserAnalyticsResponse> => {
	if (!isRecord(value) || !('data' in value) || !('timestamp' in value)) {
		return false;
	}
	return hasBasicValue(value.timestamp, 'string') && isUnifiedUserAnalyticsResponse(value.data);
};
