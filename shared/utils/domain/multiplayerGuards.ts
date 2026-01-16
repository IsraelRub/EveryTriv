import { MultiplayerEvent, RoomStatus, VALIDATORS } from '@shared/constants';
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

export function isPlayer(value: unknown): value is Player {
	if (!isRecord(value)) {
		return false;
	}

	return (
		VALIDATORS.string(value.userId) &&
		VALIDATORS.string(value.email) &&
		VALIDATORS.number(value.score) &&
		VALIDATORS.string(value.status) &&
		VALIDATORS.date(value.joinedAt) &&
		VALIDATORS.boolean(value.isHost) &&
		VALIDATORS.number(value.answersSubmitted) &&
		VALIDATORS.number(value.correctAnswers) &&
		(value.currentAnswer === undefined || VALIDATORS.number(value.currentAnswer)) &&
		(value.timeSpent === undefined || VALIDATORS.number(value.timeSpent))
	);
}

export function isRoomConfig(value: unknown): value is RoomConfig {
	if (!isRecord(value)) {
		return false;
	}

	return (
		VALIDATORS.string(value.topic) &&
		VALIDATORS.string(value.difficulty) &&
		isGameDifficulty(value.difficulty) &&
		VALIDATORS.number(value.questionsPerRequest) &&
		VALIDATORS.number(value.maxPlayers) &&
		VALIDATORS.string(value.gameMode) &&
		VALIDATORS.number(value.timePerQuestion)
	);
}

function isRoomStatus(value: unknown): value is RoomStatus {
	return (
		VALIDATORS.string(value) &&
		(value === RoomStatus.WAITING ||
			value === RoomStatus.PLAYING ||
			value === RoomStatus.FINISHED ||
			value === RoomStatus.CANCELLED)
	);
}

export function isMultiplayerRoom(value: unknown): value is MultiplayerRoom {
	if (!isRecord(value)) {
		return false;
	}

	if (
		!VALIDATORS.string(value.roomId) ||
		!VALIDATORS.string(value.hostId) ||
		!VALIDATORS.number(value.currentQuestionIndex) ||
		!VALIDATORS.date(value.createdAt) ||
		!VALIDATORS.date(value.updatedAt)
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

	if (value.currentQuestionStartTime !== undefined && !VALIDATORS.date(value.currentQuestionStartTime)) {
		return false;
	}

	if (value.startTime !== undefined && !VALIDATORS.date(value.startTime)) {
		return false;
	}

	if (value.endTime !== undefined && !VALIDATORS.date(value.endTime)) {
		return false;
	}

	return true;
}

export function isCreateRoomResponse(value: unknown): value is CreateRoomResponse {
	if (!isRecord(value)) {
		return false;
	}
	return (
		hasPropertyOfType(value, 'room', isMultiplayerRoom) && hasProperty(value, 'code') && VALIDATORS.string(value.code)
	);
}

export function isRoomStateResponse(value: unknown): value is RoomStateResponse {
	if (!isRecord(value)) {
		return false;
	}
	return hasPropertyOfType(value, 'room', isMultiplayerRoom) && hasPropertyOfType(value, 'gameState', isGameState);
}

export function isGameState(value: unknown): value is GameState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		VALIDATORS.string(value.roomId) &&
		VALIDATORS.number(value.currentQuestionIndex) &&
		VALIDATORS.number(value.gameQuestionCount) &&
		VALIDATORS.number(value.timeRemaining) &&
		isRecord(value.playersAnswers) &&
		isRecord(value.playersScores) &&
		Array.isArray(value.leaderboard) &&
		value.leaderboard.every(isPlayer) &&
		(value.currentQuestion === null || isRecord(value.currentQuestion)) &&
		(value.startedAt === undefined || VALIDATORS.date(value.startedAt))
	);
}

export function isPlayerJoinedEvent(value: unknown): value is GameEvent<MultiplayerEvent.PLAYER_JOINED> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		VALIDATORS.string(value.type) &&
		value.type === MultiplayerEvent.PLAYER_JOINED &&
		VALIDATORS.string(value.roomId) &&
		VALIDATORS.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasPropertyOfType(value.data, 'players', (val): val is Player[] => Array.isArray(val) && val.every(isPlayer)) &&
		hasPropertyOfType(value.data, 'player', isPlayer)
	);
}

export function isPlayerLeftEvent(value: unknown): value is GameEvent<MultiplayerEvent.PLAYER_LEFT> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		VALIDATORS.string(value.type) &&
		value.type === MultiplayerEvent.PLAYER_LEFT &&
		VALIDATORS.string(value.roomId) &&
		VALIDATORS.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasPropertyOfType(value.data, 'players', (val): val is Player[] => Array.isArray(val) && val.every(isPlayer)) &&
		VALIDATORS.string(value.data.userId)
	);
}

export function isGameStartedEvent(value: unknown): value is GameEvent<MultiplayerEvent.GAME_STARTED> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		VALIDATORS.string(value.type) &&
		value.type === MultiplayerEvent.GAME_STARTED &&
		VALIDATORS.string(value.roomId) &&
		VALIDATORS.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		Array.isArray(value.data.questions) &&
		hasProperty(value.data, 'config') &&
		isRoomConfig(value.data.config)
	);
}

export function isQuestionStartedEvent(value: unknown): value is GameEvent<MultiplayerEvent.QUESTION_STARTED> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		VALIDATORS.string(value.type) &&
		value.type === MultiplayerEvent.QUESTION_STARTED &&
		VALIDATORS.string(value.roomId) &&
		VALIDATORS.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasProperty(value.data, 'question') &&
		isRecord(value.data.question) &&
		VALIDATORS.number(value.data.questionIndex) &&
		VALIDATORS.number(value.data.timeLimit)
	);
}

export function isAnswerReceivedEvent(value: unknown): value is GameEvent<MultiplayerEvent.ANSWER_RECEIVED> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		VALIDATORS.string(value.type) &&
		value.type === MultiplayerEvent.ANSWER_RECEIVED &&
		VALIDATORS.string(value.roomId) &&
		VALIDATORS.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		VALIDATORS.string(value.data.userId) &&
		VALIDATORS.string(value.data.questionId) &&
		VALIDATORS.boolean(value.data.isCorrect) &&
		VALIDATORS.number(value.data.scoreEarned) &&
		(value.data.leaderboard === undefined ||
			(Array.isArray(value.data.leaderboard) && value.data.leaderboard.every(isPlayer)))
	);
}

export function isQuestionEndedEvent(value: unknown): value is GameEvent<MultiplayerEvent.QUESTION_ENDED> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		VALIDATORS.string(value.type) &&
		value.type === MultiplayerEvent.QUESTION_ENDED &&
		VALIDATORS.string(value.roomId) &&
		VALIDATORS.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		VALIDATORS.string(value.data.questionId) &&
		VALIDATORS.number(value.data.correctAnswer) &&
		Array.isArray(value.data.results) &&
		hasPropertyOfType(value.data, 'leaderboard', (val): val is Player[] => Array.isArray(val) && val.every(isPlayer))
	);
}

export function isGameEndedEvent(value: unknown): value is GameEvent<MultiplayerEvent.GAME_ENDED> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		VALIDATORS.string(value.type) &&
		value.type === MultiplayerEvent.GAME_ENDED &&
		VALIDATORS.string(value.roomId) &&
		VALIDATORS.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasPropertyOfType(
			value.data,
			'finalLeaderboard',
			(val): val is Player[] => Array.isArray(val) && val.every(isPlayer)
		) &&
		VALIDATORS.number(value.data.gameDuration) &&
		(value.data.winner === null || isPlayer(value.data.winner))
	);
}

export function isLeaderboardUpdateEvent(value: unknown): value is GameEvent<MultiplayerEvent.LEADERBOARD_UPDATE> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		VALIDATORS.string(value.type) &&
		value.type === MultiplayerEvent.LEADERBOARD_UPDATE &&
		VALIDATORS.string(value.roomId) &&
		VALIDATORS.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasPropertyOfType(value.data, 'leaderboard', (val): val is Player[] => Array.isArray(val) && val.every(isPlayer))
	);
}

export function isRoomUpdatedEvent(value: unknown): value is GameEvent<MultiplayerEvent.ROOM_UPDATED> {
	if (!isRecord(value)) {
		return false;
	}
	return (
		VALIDATORS.string(value.type) &&
		value.type === MultiplayerEvent.ROOM_UPDATED &&
		VALIDATORS.string(value.roomId) &&
		VALIDATORS.date(value.timestamp) &&
		hasProperty(value, 'data') &&
		isRecord(value.data) &&
		hasPropertyOfType(value.data, 'room', isMultiplayerRoom)
	);
}
