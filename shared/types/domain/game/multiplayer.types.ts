// Multiplayer game types for EveryTriv.
import { DifficultyLevel, MultiplayerEvent, PlayerStatus, QuestionState, RoomStatus } from '@shared/constants';

import type { CountRecord } from '../../core/data.types';
import type { BaseTriviaConfig, TriviaQuestion } from './trivia.types';

export interface Player {
	userId: string;
	email: string;
	firstName?: string;
	lastName?: string;
	displayName?: string;
	avatar?: number;
	avatarUrl?: string;
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

export interface CreateRoomConfig extends BaseTriviaConfig {
	questionsPerRequest: number;
	maxPlayers: number;
	answerCount?: number;
}

export interface RoomConfig extends CreateRoomConfig {
	mappedDifficulty: DifficultyLevel;
}

export type PlayerAnswerMap = Record<string, number>;

export type PlayerScoreMap = Record<string, number>;

export interface MultiplayerRoom {
	roomId: string;
	hostId: string;
	players: Player[];
	config: RoomConfig;
	status: RoomStatus;
	currentQuestionIndex: number;
	questions: TriviaQuestion[];
	currentQuestionStartTime?: Date;
	questionState?: QuestionState;
	version: number;
	startTime?: Date;
	endTime?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface GameState {
	roomId: string;
	currentQuestion: TriviaQuestion | null;
	currentQuestionIndex: number;
	gameQuestionCount: number;
	timeRemaining: number;
	playersAnswers: PlayerAnswerMap;
	playersScores: PlayerScoreMap;
	leaderboard: Player[];
	startedAt?: string;
	currentQuestionStartTime?: string;
	serverStartTimestamp?: number;
	serverEndTimestamp?: number;
	answerCounts?: CountRecord;
}

export interface QuestionResult {
	userId: string;
	isCorrect: boolean;
	scoreEarned: number;
}

export type GameEventDataMap = {
	[MultiplayerEvent.PLAYER_JOINED]: {
		player: Player;
		players: Player[];
	};
	[MultiplayerEvent.PLAYER_LEFT]: {
		userId: string;
		players: Player[];
	};
	[MultiplayerEvent.GAME_STARTED]: {
		questions: TriviaQuestion[];
		config: RoomConfig;
	};
	[MultiplayerEvent.QUESTION_STARTED]: {
		question: TriviaQuestion;
		questionIndex: number;
		timeLimit: number;
		serverStartTimestamp: number;
		serverEndTimestamp: number;
	};
	[MultiplayerEvent.ANSWER_RECEIVED]: {
		userId: string;
		questionId: string;
		answerIndex: number;
		isCorrect: boolean;
		scoreEarned: number;
		leaderboard?: Player[];
		answerCounts?: CountRecord;
	};
	[MultiplayerEvent.QUESTION_ENDED]: {
		questionId: string;
		correctAnswer: number;
		results: QuestionResult[];
		leaderboard: Player[];
		answerCounts?: CountRecord;
	};
	[MultiplayerEvent.GAME_ENDED]: {
		finalLeaderboard: Player[];
		winner: Player | null;
		gameDuration: number;
	};
	[MultiplayerEvent.ROOM_UPDATED]: {
		room: MultiplayerRoom;
	};
	[MultiplayerEvent.ERROR]: {
		message: string;
		code: string;
	};
};

export type GameEventType = keyof GameEventDataMap;

export interface GameEvent<T extends GameEventType = GameEventType> {
	type: T;
	roomId: string;
	timestamp: Date;
	data: GameEventDataMap[T];
}

export interface CreateRoomResponse {
	room: MultiplayerRoom;
	code: string;
}

export interface RoomStateResponse {
	room: MultiplayerRoom;
	gameState: GameState;
}

export interface MultiplayerSubmitAnswerResult {
	room: MultiplayerRoom;
	isCorrect: boolean;
	scoreEarned: number;
	leaderboard?: Player[];
	answerCounts?: CountRecord;
}

export interface QuestionEndResult {
	results: QuestionResult[];
	leaderboard: Player[];
	room: MultiplayerRoom;
	answerCounts?: CountRecord;
}

export interface QuestionStartResponse {
	question: TriviaQuestion;
	questionIndex: number;
	timeLimit: number;
	serverStartTimestamp: number;
	serverEndTimestamp: number;
}

export interface QuestionEndResponse {
	questionId: string;
	correctAnswer: number;
	results: QuestionResult[];
	leaderboard: Player[];
	updatedRoom: MultiplayerRoom;
	answerCounts?: CountRecord;
}
