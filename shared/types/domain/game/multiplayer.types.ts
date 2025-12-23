/**
 * Multiplayer game types for EveryTriv
 *
 * @module MultiplayerTypes
 * @description Type definitions for multiplayer simultaneous trivia games
 * @used_by server/src/features/game/multiplayer, client/src/services/multiplayer.service.ts
 */
import { DifficultyLevel, GameMode, PlayerStatus, RoomStatus } from '@shared/constants';

import type { BaseEntity } from '../../core/data.types';
import type { BaseTriviaConfig, TriviaQuestion } from './trivia.types';

/**
 * Player interface for multiplayer game
 * @interface Player
 * @description Player information in a multiplayer room
 */
export interface Player {
	userId: string;
	email: string;
	displayName?: string;
	score: number;
	status: PlayerStatus;
	joinedAt: Date;
	lastActivity?: Date;
	isHost: boolean;
	currentAnswer?: number;
	timeSpent?: number;
	answersSubmitted: number;
	correctAnswers: number;
}

/**
 * Configuration for creating a new multiplayer room
 * @interface CreateRoomConfig
 * @description Input configuration when creating a room (client-side)
 */
export interface CreateRoomConfig extends BaseTriviaConfig {
	questionsPerRequest: number;
	maxPlayers: number;
	gameMode: GameMode;
}

/**
 * Multiplayer room configuration
 * @interface RoomConfig
 * @description Complete room configuration (server-side, includes timePerQuestion)
 */
export interface RoomConfig extends CreateRoomConfig {
	timePerQuestion: number; // See MULTIPLAYER_CONSTANTS.TIME_PER_QUESTION
	mappedDifficulty?: DifficultyLevel; // Normalized difficulty level (set by controller/pipe)
}

/**
 * Mapping between user IDs and their latest submitted answer index
 */
export interface PlayerAnswerMap {
	[userId: string]: number;
}

/**
 * Mapping between user IDs and their current score
 */
export interface PlayerScoreMap {
	[userId: string]: number;
}

/**
 * Multiplayer room interface
 * @interface MultiplayerRoom
 * @description Room state for multiplayer game
 */
export interface MultiplayerRoom extends BaseEntity {
	roomId: string;
	hostId: string;
	players: Player[];
	config: RoomConfig;
	status: RoomStatus;
	currentQuestionIndex: number;
	questions: TriviaQuestion[];
	currentQuestionStartTime?: Date;
	startTime?: Date;
	endTime?: Date;
}

/**
 * Game state for multiplayer game
 * @interface GameState
 * @description Current game state in a multiplayer room
 */
export interface GameState {
	roomId: string;
	currentQuestion: TriviaQuestion | null;
	currentQuestionIndex: number;
	gameQuestionCount: number;
	timeRemaining: number;
	playersAnswers: PlayerAnswerMap;
	playersScores: PlayerScoreMap;
	leaderboard: Player[];
	startedAt?: Date;
}

/**
 * Answer submission for multiplayer game
 * @interface AnswerSubmission
 * @description Answer submission data
 */
export interface AnswerSubmission {
	roomId: string;
	userId: string;
	questionId: string;
	answer: number;
	timeSpent: number;
	submittedAt: Date;
}

/**
 * Game event types
 */
export type GameEventType =
	| 'player-joined'
	| 'player-left'
	| 'player-ready'
	| 'game-started'
	| 'question-started'
	| 'answer-received'
	| 'question-ended'
	| 'game-ended'
	| 'leaderboard-update'
	| 'room-updated'
	| 'error';

/**
 * Game event data map type
 * @type GameEventDataMap
 * @description Maps event types to their data structures
 */
export type GameEventDataMap = {
	'player-joined': {
		player: Player;
		players: Player[];
	};
	'player-left': {
		userId: string;
		players: Player[];
	};
	'player-ready': {
		player: Player;
		players: Player[];
	};
	'game-started': {
		questions: TriviaQuestion[];
		config: RoomConfig;
	};
	'question-started': {
		question: TriviaQuestion;
		questionIndex: number;
		timeLimit: number;
	};
	'answer-received': {
		userId: string;
		questionId: string;
		isCorrect: boolean;
		scoreEarned: number;
		leaderboard?: Player[];
	};
	'question-ended': {
		questionId: string;
		correctAnswer: number;
		results: Array<{
			userId: string;
			isCorrect: boolean;
			scoreEarned: number;
		}>;
		leaderboard: Player[];
	};
	'game-ended': {
		finalLeaderboard: Player[];
		winner: Player | null;
		gameDuration: number;
	};
	'leaderboard-update': {
		leaderboard: Player[];
	};
	'room-updated': {
		room: MultiplayerRoom;
	};
	error: {
		message: string;
		code: string;
	};
};

/**
 * Base game event interface
 * @interface GameEvent
 * @description Base structure for all game events with type-safe data
 */
export interface GameEvent<T extends GameEventType = GameEventType> {
	type: T;
	roomId: string;
	timestamp: Date;
	data: GameEventDataMap[T];
}

/**
 * Type aliases for specific game events (for convenience and backward compatibility)
 */
export type PlayerJoinedEvent = GameEvent<'player-joined'>;
export type PlayerLeftEvent = GameEvent<'player-left'>;
export type PlayerReadyEvent = GameEvent<'player-ready'>;
export type GameStartedEvent = GameEvent<'game-started'>;
export type QuestionStartedEvent = GameEvent<'question-started'>;
export type AnswerReceivedEvent = GameEvent<'answer-received'>;
export type QuestionEndedEvent = GameEvent<'question-ended'>;
export type GameEndedEvent = GameEvent<'game-ended'>;
export type LeaderboardUpdateEvent = GameEvent<'leaderboard-update'>;
export type RoomUpdatedEvent = GameEvent<'room-updated'>;
export type ErrorEvent = GameEvent<'error'>;

/**
 * Union type for all game events
 */
export type MultiplayerGameEvent = GameEvent<GameEventType>;

/**
 * Create room response interface
 * @interface CreateRoomResponse
 * @description Response from creating a multiplayer room
 */
export interface CreateRoomResponse {
	room: MultiplayerRoom;
	code: string;
}

/**
 * Submit answer response type
 * @type SubmitAnswerResponse
 * @description Alias for SubmitAnswerHttpResponse
 */
export type SubmitAnswerResponse = MultiplayerAnswerResult;

/**
 * Room state response interface
 * @interface RoomStateResponse
 * @description Response containing room state information
 */
export interface RoomStateResponse {
	room: MultiplayerRoom;
	gameState: GameState;
}

/**
 * Multiplayer answer result interface
 * @interface MultiplayerAnswerResult
 * @description Result from submitting an answer in multiplayer game
 */
export interface MultiplayerAnswerResult {
	room: MultiplayerRoom;
	isCorrect: boolean;
	scoreEarned: number;
	leaderboard?: Player[];
}
