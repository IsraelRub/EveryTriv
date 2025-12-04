/**
 * Multiplayer game types for EveryTriv
 *
 * @module MultiplayerTypes
 * @description Type definitions for multiplayer simultaneous trivia games
 * @used_by server/src/features/game/multiplayer, client/src/services/multiplayer.service.ts
 */
import { GameMode } from '@shared/constants';

import type { BaseEntity } from '../../core/data.types';
import type { BaseTriviaConfig, TriviaQuestion } from './trivia.types';

/**
 * Player status in multiplayer game
 */
export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'answered' | 'disconnected' | 'finished';

/**
 * Room status
 */
export type RoomStatus = 'waiting' | 'starting' | 'playing' | 'finished' | 'cancelled';

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
 * Base game event interface
 * @interface GameEvent
 * @description Base structure for all game events
 */
export interface GameEvent {
	type: GameEventType;
	roomId: string;
	timestamp: Date;
	data?: unknown;
}

/**
 * Player joined event
 */
export interface PlayerJoinedEvent extends GameEvent {
	type: 'player-joined';
	data: {
		player: Player;
		players: Player[];
	};
}

/**
 * Player left event
 */
export interface PlayerLeftEvent extends GameEvent {
	type: 'player-left';
	data: {
		userId: string;
		players: Player[];
	};
}

/**
 * Game started event
 */
export interface GameStartedEvent extends GameEvent {
	type: 'game-started';
	data: {
		questions: TriviaQuestion[];
		config: RoomConfig;
	};
}

/**
 * Question started event
 */
export interface QuestionStartedEvent extends GameEvent {
	type: 'question-started';
	data: {
		question: TriviaQuestion;
		questionIndex: number;
		timeLimit: number;
	};
}

/**
 * Answer received event
 */
export interface AnswerReceivedEvent extends GameEvent {
	type: 'answer-received';
	data: {
		userId: string;
		questionId: string;
		isCorrect: boolean;
		scoreEarned: number;
		leaderboard: Player[];
	};
}

/**
 * Question ended event
 */
export interface QuestionEndedEvent extends GameEvent {
	type: 'question-ended';
	data: {
		questionId: string;
		correctAnswer: number;
		results: Array<{
			userId: string;
			isCorrect: boolean;
			scoreEarned: number;
		}>;
		leaderboard: Player[];
	};
}

/**
 * Game ended event
 */
export interface GameEndedEvent extends GameEvent {
	type: 'game-ended';
	data: {
		finalLeaderboard: Player[];
		winner: Player | null;
		gameDuration: number;
	};
}

/**
 * Leaderboard update event
 */
export interface LeaderboardUpdateEvent extends GameEvent {
	type: 'leaderboard-update';
	data: {
		leaderboard: Player[];
	};
}

/**
 * Room updated event
 */
export interface RoomUpdatedEvent extends GameEvent {
	type: 'room-updated';
	data: {
		room: MultiplayerRoom;
	};
}

/**
 * Error event
 */
export interface ErrorEvent extends GameEvent {
	type: 'error';
	data: {
		message: string;
		code?: string;
	};
}

/**
 * Union type for all game events
 */
export type MultiplayerGameEvent =
	| PlayerJoinedEvent
	| PlayerLeftEvent
	| GameStartedEvent
	| QuestionStartedEvent
	| AnswerReceivedEvent
	| QuestionEndedEvent
	| GameEndedEvent
	| LeaderboardUpdateEvent
	| RoomUpdatedEvent
	| ErrorEvent;
