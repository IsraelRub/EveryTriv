import type { Response } from 'express';

import { VALID_GAME_MODES_SET, VALID_GAME_STATUSES, VALIDATORS } from '@shared/constants';
import type { GameDifficulty, LeaderboardStats, StorageValue } from '@shared/types';
import { isRecord } from '@shared/utils';
import { isGameDifficulty } from '@shared/validation';

import { PUBLIC_ENDPOINTS } from '@internal/constants';
import type { GameSessionQuestion, GameSessionState, PayPalErrorResponse } from '@internal/types';

export { isErrorWithProperties } from '@shared/utils';

export function isPublicEndpoint(path: string): boolean {
	return PUBLIC_ENDPOINTS.some(
		endpoint => path === endpoint || path?.startsWith(endpoint + '?') || path?.startsWith(endpoint + '/')
	);
}

function isGameSessionQuestion(value: unknown): value is GameSessionQuestion {
	if (!isRecord(value)) {
		return false;
	}

	return (
		VALIDATORS.string(value.questionId) &&
		VALIDATORS.number(value.answer) &&
		VALIDATORS.number(value.timeSpent) &&
		VALIDATORS.boolean(value.isCorrect) &&
		VALIDATORS.number(value.score)
	);
}

export function hasSessionBasicFields(value: unknown): value is {
	startedAt: string;
	userId: string;
	gameId: string;
} {
	if (!isRecord(value)) {
		return false;
	}

	return VALIDATORS.string(value.startedAt) && VALIDATORS.string(value.userId) && VALIDATORS.string(value.gameId);
}

export function isGameSessionState(value: unknown): value is GameSessionState {
	if (!isRecord(value)) {
		return false;
	}

	if (
		!VALIDATORS.string(value.gameId) ||
		!VALIDATORS.string(value.userId) ||
		!VALIDATORS.string(value.topic) ||
		!VALIDATORS.string(value.difficulty) ||
		!VALIDATORS.string(value.startedAt) ||
		!VALIDATORS.number(value.currentScore) ||
		!VALIDATORS.number(value.correctAnswers) ||
		!VALIDATORS.number(value.totalQuestions)
	) {
		return false;
	}

	if (!VALIDATORS.string(value.gameMode) || !VALID_GAME_MODES_SET.has(value.gameMode)) {
		return false;
	}

	if (!VALIDATORS.string(value.status) || !VALID_GAME_STATUSES.has(value.status)) {
		return false;
	}

	if (!Array.isArray(value.questions)) {
		return false;
	}

	return value.questions.every(isGameSessionQuestion);
}

export function isValidGameDifficulty(value: string): value is GameDifficulty {
	return isGameDifficulty(value);
}

export function isLeaderboardStats(value: unknown): value is LeaderboardStats {
	if (!isRecord(value)) {
		return false;
	}

	return (
		VALIDATORS.number(value.activeUsers) &&
		VALIDATORS.number(value.averageScore) &&
		VALIDATORS.number(value.averageGames)
	);
}

export function isErrorWithPayPalResponse(error: unknown): error is { response?: { data?: PayPalErrorResponse } } {
	if (!isRecord(error)) {
		return false;
	}

	if (!('response' in error)) {
		return false;
	}

	const response = error.response;
	if (response === undefined) {
		return true;
	}

	if (!isRecord(response)) {
		return false;
	}

	if (!('data' in response)) {
		return true;
	}

	const data = response.data;
	if (data === undefined) {
		return true;
	}

	if (!isRecord(data)) {
		return false;
	}

	return VALIDATORS.string(data.name) && VALIDATORS.string(data.message) && VALIDATORS.string(data.debug_id);
}

export function isValidCacheEntry(entry: unknown): entry is { key: string; value: StorageValue; ttl?: number } {
	if (!isRecord(entry)) {
		return false;
	}
	const obj = entry;
	const hasKey = 'key' in obj && VALIDATORS.string(Reflect.get(obj, 'key'));
	const hasValue = 'value' in obj;
	const hasTtl = 'ttl' in obj;
	const ttlValue = hasTtl ? Reflect.get(obj, 'ttl') : undefined;
	const isValidTtl = !hasTtl || ttlValue === undefined || (VALIDATORS.number(ttlValue) && ttlValue >= 0);

	return hasKey && hasValue && isValidTtl;
}

export function isMiddlewareMetrics(metrics: unknown): metrics is { requestCount: number } {
	return isRecord(metrics) && VALIDATORS.number(metrics.requestCount);
}

export function isExpressResponse(value: unknown): value is Response {
	return isRecord(value) && VALIDATORS.function(value.status) && VALIDATORS.function(value.setHeader);
}

export function isCacheableValue(value: unknown): value is StorageValue {
	if (value === undefined) {
		return false;
	}

	if (value === null || Object.values(VALIDATORS).some(validator => validator(value))) {
		return true;
	}

	if (Array.isArray(value)) {
		return value.every(isCacheableValue);
	}

	if (isRecord(value)) {
		return Object.values(value).every(isCacheableValue);
	}

	return false;
}
