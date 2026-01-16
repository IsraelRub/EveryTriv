import { GameMode, VALID_GAME_MODES_SET, VALIDATORS } from '@shared/constants';
import type { GameDifficulty, LeaderboardStats } from '@shared/types';
import { isRecord } from '@shared/utils';
import { isGameDifficulty } from '@shared/validation';

import { PUBLIC_ENDPOINTS } from '@internal/constants';
import type { LeaderboardEntity } from '@internal/entities';
import type { GameSessionQuestion, PayPalErrorResponse } from '@internal/types';

export function isPublicEndpoint(path: string): boolean {
	return PUBLIC_ENDPOINTS.some(
		endpoint => path === endpoint || path?.startsWith(endpoint + '?') || path?.startsWith(endpoint + '/')
	);
}

export function isErrorWithProperties(error: unknown): error is { name?: string; message?: string } {
	if (!isRecord(error)) {
		return false;
	}

	return (
		(error.name === undefined || VALIDATORS.string(error.name)) &&
		(error.message === undefined || VALIDATORS.string(error.message))
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

export function isGameSessionState(value: unknown): value is {
	gameId: string;
	userId: string;
	topic: string;
	difficulty: string;
	gameMode: GameMode;
	startedAt: string;
	lastHeartbeat?: string;
	questions: GameSessionQuestion[];
	currentScore: number;
	correctAnswers: number;
	totalQuestions: number;
	status: 'in_progress' | 'completed';
} {
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

	if (!VALIDATORS.string(value.status) || (value.status !== 'in_progress' && value.status !== 'completed')) {
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

function isLeaderboardEntity(value: unknown): value is LeaderboardEntity {
	if (!isRecord(value)) {
		return false;
	}

	return (
		VALIDATORS.string(value.id) &&
		VALIDATORS.string(value.userId) &&
		VALIDATORS.string(value.userStatsId) &&
		VALIDATORS.number(value.rank) &&
		VALIDATORS.number(value.percentile) &&
		VALIDATORS.number(value.score) &&
		VALIDATORS.number(value.totalUsers)
	);
}

export function isLeaderboardEntityOrNull(value: unknown): value is LeaderboardEntity | null {
	return value === null || isLeaderboardEntity(value);
}

export function isLeaderboardEntityArray(value: unknown): value is LeaderboardEntity[] {
	return Array.isArray(value) && value.every(isLeaderboardEntity);
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
