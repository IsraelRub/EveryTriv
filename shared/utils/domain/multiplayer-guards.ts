/**
 * Multiplayer Type Guards
 *
 * @module MultiplayerGuards
 * @description Type guards for multiplayer game types
 * @used_by server/src/features/game/multiplayer, client/src/hooks/useMultiplayer.ts
 */
import { RoomStatus, defaultValidators } from '@shared/constants';
import type {
	CreateRoomResponse,
	GameEvent,
	GameState,
	MultiplayerRoom,
	Player,
	RoomConfig,
	RoomStateResponse,
} from '@shared/types';
import { isGameDifficulty } from '@shared/validation';
import { hasProperty, hasPropertyOfType, isRecord } from '../core';

/**
 * Type guard for Player
 */
export function isPlayer(value: unknown): value is Player {
	if (!isRecord(value)) {
		return false;
	}

	return (
		defaultValidators.string(value.userId) &&
		defaultValidators.string(value.email) &&
		defaultValidators.number(value.score) &&
		defaultValidators.string(value.status) &&
		defaultValidators.date(value.joinedAt) &&
		defaultValidators.boolean(value.isHost) &&
		defaultValidators.number(value.answersSubmitted) &&
		defaultValidators.number(value.correctAnswers) &&
		(value.currentAnswer === undefined || defaultValidators.number(value.currentAnswer)) &&
		(value.timeSpent === undefined || defaultValidators.number(value.timeSpent))
	);
}

/**
 * Type guard for RoomConfig
 */
export function isRoomConfig(value: unknown): value is RoomConfig {
	if (!isRecord(value)) {
		return false;
	}

	return (
		defaultValidators.string(value.topic) &&
		defaultValidators.string(value.difficulty) &&
		isGameDifficulty(value.difficulty) &&
		defaultValidators.number(value.questionsPerRequest) &&
		defaultValidators.number(value.maxPlayers) &&
		defaultValidators.string(value.gameMode) &&
		defaultValidators.number(value.timePerQuestion)
	);
}

/**
 * Type guard for RoomStatus
 */
function isRoomStatus(value: unknown): value is RoomStatus {
	return (
		defaultValidators.string(value) &&
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
		!defaultValidators.string(value.roomId) ||
		!defaultValidators.string(value.hostId) ||
		!defaultValidators.number(value.currentQuestionIndex) ||
		!defaultValidators.date(value.createdAt) ||
		!defaultValidators.date(value.updatedAt)
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

	if (value.currentQuestionStartTime !== undefined && !defaultValidators.date(value.currentQuestionStartTime)) {
		return false;
	}

	if (value.startTime !== undefined && !defaultValidators.date(value.startTime)) {
		return false;
	}

	if (value.endTime !== undefined && !defaultValidators.date(value.endTime)) {
		return false;
	}

	return true;
}

/**
 * Type guard for CreateRoomResponse
 */
export function isCreateRoomResponse(value: unknown): value is CreateRoomResponse {
	if (!isRecord(value)) {
		return false;
	}
	return (
		hasPropertyOfType(value, 'room', isMultiplayerRoom) && hasProperty(value, 'code') && defaultValidators.string(value.code)
	);
}

/**
 * Type guard for RoomStateResponse
 */
export function isRoomStateResponse(value: unknown): value is RoomStateResponse {
	if (!isRecord(value)) {
		return false;
	}
	return hasPropertyOfType(value, 'room', isMultiplayerRoom) && hasPropertyOfType(value, 'gameState', isGameState);
}

/**
 * Type guard for GameState
 */
export function isGameState(value: unknown): value is GameState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		defaultValidators.string(value.roomId) &&
		defaultValidators.number(value.currentQuestionIndex) &&
		defaultValidators.number(value.gameQuestionCount) &&
		defaultValidators.number(value.timeRemaining) &&
		isRecord(value.playersAnswers) &&
		isRecord(value.playersScores) &&
		Array.isArray(value.leaderboard) &&
		value.leaderboard.every(isPlayer) &&
		(value.currentQuestion === null || isRecord(value.currentQuestion)) &&
		(value.startedAt === undefined || defaultValidators.date(value.startedAt))
	);
}

/**
 * Type guard for PlayerJoinedEvent
 */
export function isPlayerJoinedEvent(value: unknown): value is GameEvent<'player-joined'> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		defaultValidators.string(value.type) &&
		value.type === 'player-joined' &&
		defaultValidators.string(value.roomId) &&
		defaultValidators.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasPropertyOfType(value.data, 'players', (val): val is Player[] => Array.isArray(val) && val.every(isPlayer)) &&
		hasPropertyOfType(value.data, 'player', isPlayer)
	);
}

/**
 * Type guard for PlayerLeftEvent
 */
export function isPlayerLeftEvent(value: unknown): value is GameEvent<'player-left'> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		defaultValidators.string(value.type) &&
		value.type === 'player-left' &&
		defaultValidators.string(value.roomId) &&
		defaultValidators.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasPropertyOfType(value.data, 'players', (val): val is Player[] => Array.isArray(val) && val.every(isPlayer)) &&
		defaultValidators.string(value.data.userId)
	);
}

/**
 * Type guard for GameStartedEvent
 */
export function isGameStartedEvent(value: unknown): value is GameEvent<'game-started'> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		defaultValidators.string(value.type) &&
		value.type === 'game-started' &&
		defaultValidators.string(value.roomId) &&
		defaultValidators.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		Array.isArray(value.data.questions) &&
		hasProperty(value.data, 'config') &&
		isRoomConfig(value.data.config)
	);
}

/**
 * Type guard for QuestionStartedEvent
 */
export function isQuestionStartedEvent(value: unknown): value is GameEvent<'question-started'> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		defaultValidators.string(value.type) &&
		value.type === 'question-started' &&
		defaultValidators.string(value.roomId) &&
		defaultValidators.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasProperty(value.data, 'question') &&
		isRecord(value.data.question) &&
		defaultValidators.number(value.data.questionIndex) &&
		defaultValidators.number(value.data.timeLimit)
	);
}

/**
 * Type guard for AnswerReceivedEvent
 */
export function isAnswerReceivedEvent(value: unknown): value is GameEvent<'answer-received'> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		defaultValidators.string(value.type) &&
		value.type === 'answer-received' &&
		defaultValidators.string(value.roomId) &&
		defaultValidators.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		defaultValidators.string(value.data.userId) &&
		defaultValidators.string(value.data.questionId) &&
		defaultValidators.boolean(value.data.isCorrect) &&
		defaultValidators.number(value.data.scoreEarned) &&
		(value.data.leaderboard === undefined ||
			(Array.isArray(value.data.leaderboard) && value.data.leaderboard.every(isPlayer)))
	);
}

/**
 * Type guard for QuestionEndedEvent
 */
export function isQuestionEndedEvent(value: unknown): value is GameEvent<'question-ended'> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		defaultValidators.string(value.type) &&
		value.type === 'question-ended' &&
		defaultValidators.string(value.roomId) &&
		defaultValidators.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		defaultValidators.string(value.data.questionId) &&
		defaultValidators.number(value.data.correctAnswer) &&
		Array.isArray(value.data.results) &&
		hasPropertyOfType(value.data, 'leaderboard', (val): val is Player[] => Array.isArray(val) && val.every(isPlayer))
	);
}

/**
 * Type guard for GameEndedEvent
 */
export function isGameEndedEvent(value: unknown): value is GameEvent<'game-ended'> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		defaultValidators.string(value.type) &&
		value.type === 'game-ended' &&
		defaultValidators.string(value.roomId) &&
		defaultValidators.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasPropertyOfType(
			value.data,
			'finalLeaderboard',
			(val): val is Player[] => Array.isArray(val) && val.every(isPlayer)
		) &&
		defaultValidators.number(value.data.gameDuration) &&
		(value.data.winner === null || isPlayer(value.data.winner))
	);
}

/**
 * Type guard for LeaderboardUpdateEvent
 */
export function isLeaderboardUpdateEvent(value: unknown): value is GameEvent<'leaderboard-update'> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		defaultValidators.string(value.type) &&
		value.type === 'leaderboard-update' &&
		defaultValidators.string(value.roomId) &&
		defaultValidators.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasPropertyOfType(value.data, 'leaderboard', (val): val is Player[] => Array.isArray(val) && val.every(isPlayer))
	);
}

/**
 * Type guard for RoomUpdatedEvent
 */
export function isRoomUpdatedEvent(value: unknown): value is GameEvent<'room-updated'> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		defaultValidators.string(value.type) &&
		value.type === 'room-updated' &&
		defaultValidators.string(value.roomId) &&
		defaultValidators.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasPropertyOfType(value.data, 'room', isMultiplayerRoom)
	);
}
