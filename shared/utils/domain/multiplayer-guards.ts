/**
 * Multiplayer Type Guards
 *
 * @module MultiplayerGuards
 * @description Type guards for multiplayer game types
 * @used_by server/src/features/game/multiplayer
 */
import { RoomStatus } from '@shared/constants';
import type { MultiplayerRoom, Player, RoomConfig } from '@shared/types';
import { isGameDifficulty } from '@shared/validation';

import { isRecord } from '../core';

/**
 * Type guard for Player
 */
function isPlayer(value: unknown): value is Player {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.userId === 'string' &&
		typeof value.email === 'string' &&
		typeof value.score === 'number' &&
		Number.isFinite(value.score) &&
		typeof value.status === 'string' &&
		value.joinedAt instanceof Date &&
		typeof value.isHost === 'boolean' &&
		typeof value.answersSubmitted === 'number' &&
		Number.isFinite(value.answersSubmitted) &&
		typeof value.correctAnswers === 'number' &&
		Number.isFinite(value.correctAnswers) &&
		(value.currentAnswer === undefined ||
			(typeof value.currentAnswer === 'number' && Number.isFinite(value.currentAnswer))) &&
		(value.timeSpent === undefined || (typeof value.timeSpent === 'number' && Number.isFinite(value.timeSpent)))
	);
}

/**
 * Type guard for RoomConfig
 */
function isRoomConfig(value: unknown): value is RoomConfig {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.topic === 'string' &&
		typeof value.difficulty === 'string' &&
		isGameDifficulty(value.difficulty) &&
		typeof value.questionsPerRequest === 'number' &&
		Number.isFinite(value.questionsPerRequest) &&
		typeof value.maxPlayers === 'number' &&
		Number.isFinite(value.maxPlayers) &&
		typeof value.gameMode === 'string' &&
		typeof value.timePerQuestion === 'number' &&
		Number.isFinite(value.timePerQuestion)
	);
}

/**
 * Type guard for RoomStatus
 */
function isRoomStatus(value: unknown): value is RoomStatus {
	return (
		typeof value === 'string' &&
		(value === RoomStatus.WAITING ||
			value === RoomStatus.PLAYING ||
			value === RoomStatus.FINISHED ||
			value === RoomStatus.CANCELLED)
	);
}

/**
 * Type guard for MultiplayerRoom
 */
export function isMultiplayerRoom(value: unknown): value is MultiplayerRoom {
	if (!isRecord(value)) {
		return false;
	}

	if (
		typeof value.id !== 'string' ||
		typeof value.roomId !== 'string' ||
		typeof value.hostId !== 'string' ||
		!(typeof value.currentQuestionIndex === 'number' && Number.isFinite(value.currentQuestionIndex)) ||
		!(value.createdAt instanceof Date) ||
		!(value.updatedAt instanceof Date)
	) {
		return false;
	}

	if (!isRoomStatus(value.status)) {
		return false;
	}

	if (!isRoomConfig(value.config)) {
		return false;
	}

	if (!Array.isArray(value.players)) {
		return false;
	}

	if (!value.players.every(isPlayer)) {
		return false;
	}

	if (!Array.isArray(value.questions)) {
		return false;
	}

	if (value.currentQuestionStartTime !== undefined && !(value.currentQuestionStartTime instanceof Date)) {
		return false;
	}

	if (value.startTime !== undefined && !(value.startTime instanceof Date)) {
		return false;
	}

	if (value.endTime !== undefined && !(value.endTime instanceof Date)) {
		return false;
	}

	return true;
}
