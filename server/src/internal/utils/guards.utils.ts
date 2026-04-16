import { GAME_MODES } from '@shared/constants';
import type { LeaderboardStats, StorageValue } from '@shared/types';
import { hasProperty, isRecord } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { GAME_STATUSES, PUBLIC_ENDPOINTS } from '@internal/constants';
import type {
	GameSessionQuestion,
	GameSessionQuestionSnapshot,
	PayPalErrorResponse,
	ServerGameSessionState,
} from '@internal/types';

export function isPublicEndpoint(path: string): boolean {
	return PUBLIC_ENDPOINTS.some(
		endpoint => path === endpoint || path?.startsWith(`${endpoint}?`) || path?.startsWith(`${endpoint}/`)
	);
}

function isGameSessionQuestion(value: unknown): value is GameSessionQuestion {
	return (
		isRecord(value) &&
		VALIDATORS.string(value.questionId) &&
		VALIDATORS.number(value.answer) &&
		VALIDATORS.number(value.timeSpent) &&
		VALIDATORS.boolean(value.isCorrect) &&
		VALIDATORS.number(value.score)
	);
}

/** Optional field: absent, or array of strings. */
function isOptionalStringArray(value: unknown): boolean {
	return value == null || (Array.isArray(value) && value.every((item): item is string => VALIDATORS.string(item)));
}

function isGameSessionQuestionSnapshot(value: unknown): value is GameSessionQuestionSnapshot {
	return hasProperty(value, 'correctAnswerIndex') && VALIDATORS.number(value.correctAnswerIndex);
}

function isOptionalQuestionSnapshots(value: unknown): boolean {
	return (
		value == null ||
		(isRecord(value) && Object.values(value).every(snapshot => isGameSessionQuestionSnapshot(snapshot)))
	);
}

export function hasSessionBasicFields(value: unknown): value is {
	startedAt: string;
	userId: string;
	gameId: string;
} {
	return (
		isRecord(value) &&
		VALIDATORS.string(value.startedAt) &&
		VALIDATORS.string(value.userId) &&
		VALIDATORS.string(value.gameId)
	);
}

export function isGameSessionState(value: unknown): value is ServerGameSessionState {
	return (
		isRecord(value) &&
		VALIDATORS.string(value.gameId) &&
		VALIDATORS.string(value.userId) &&
		VALIDATORS.string(value.topic) &&
		VALIDATORS.string(value.difficulty) &&
		VALIDATORS.string(value.startedAt) &&
		VALIDATORS.number(value.currentScore) &&
		VALIDATORS.number(value.correctAnswers) &&
		VALIDATORS.number(value.totalQuestions) &&
		VALIDATORS.string(value.gameMode) &&
		GAME_MODES.has(value.gameMode) &&
		VALIDATORS.string(value.status) &&
		GAME_STATUSES.has(value.status) &&
		Array.isArray(value.questions) &&
		value.questions.every(isGameSessionQuestion) &&
		isOptionalStringArray(value.sessionExcludeQuestionTexts) &&
		isOptionalQuestionSnapshots(value.questionSnapshots)
	);
}

export function isLeaderboardStats(value: unknown): value is LeaderboardStats {
	return (
		isRecord(value) &&
		VALIDATORS.number(value.activeUsers) &&
		VALIDATORS.number(value.averageScore) &&
		VALIDATORS.number(value.averageGames)
	);
}

export function isErrorWithPayPalResponse(error: unknown): error is { response?: { data?: PayPalErrorResponse } } {
	return (
		isRecord(error) &&
		(!('response' in error) ||
			error.response === undefined ||
			(isRecord(error.response) &&
				(!('data' in error.response) ||
					error.response.data === undefined ||
					(isRecord(error.response.data) &&
						VALIDATORS.string(error.response.data.name) &&
						VALIDATORS.string(error.response.data.message) &&
						VALIDATORS.string(error.response.data.debug_id)))))
	);
}

export function isValidCacheEntry(entry: unknown): entry is { key: string; value: StorageValue; ttl?: number } {
	return (
		isRecord(entry) &&
		'key' in entry &&
		VALIDATORS.string(Reflect.get(entry, 'key')) &&
		'value' in entry &&
		(!('ttl' in entry) ||
			((ttl: unknown) => ttl === undefined || (VALIDATORS.number(ttl) && ttl >= 0))(Reflect.get(entry, 'ttl')))
	);
}

export function isCacheableValue(value: unknown): value is StorageValue {
	return (
		value !== undefined &&
		(value === null ||
			Object.values(VALIDATORS).some(validator => validator(value)) ||
			(Array.isArray(value) && value.every(isCacheableValue)) ||
			(isRecord(value) && Object.values(value).every(isCacheableValue)))
	);
}
