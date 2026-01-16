// Multiplayer game types for EveryTriv.
import {
	DifficultyLevel,
	GameMode,
	MultiplayerEvent,
	PlayerStatus,
	QuestionState,
	RoomStatus,
} from '@shared/constants';

import type { BaseTriviaConfig, TriviaQuestion } from './trivia.types';

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

export interface CreateRoomConfig extends BaseTriviaConfig {
	questionsPerRequest: number;
	maxPlayers: number;
	gameMode: GameMode;
}

export interface RoomConfig extends CreateRoomConfig {
	timePerQuestion: number;
	mappedDifficulty?: DifficultyLevel;
}

export interface PlayerAnswerMap {
	[userId: string]: number;
}

export interface PlayerScoreMap {
	[userId: string]: number;
}

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
	startedAt?: Date;
	currentQuestionStartTime?: Date;
	serverStartTimestamp?: number;
	serverEndTimestamp?: number;
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
	[MultiplayerEvent.PLAYER_READY]: {
		player: Player;
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
		isCorrect: boolean;
		scoreEarned: number;
		leaderboard?: Player[];
	};
	[MultiplayerEvent.QUESTION_ENDED]: {
		questionId: string;
		correctAnswer: number;
		results: QuestionResult[];
		leaderboard: Player[];
	};
	[MultiplayerEvent.GAME_ENDED]: {
		finalLeaderboard: Player[];
		winner: Player | null;
		gameDuration: number;
	};
	[MultiplayerEvent.LEADERBOARD_UPDATE]: {
		leaderboard: Player[];
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

export type MultiplayerGameEvent = GameEvent<GameEventType>;

export interface CreateRoomResponse {
	room: MultiplayerRoom;
	code: string;
}

export interface RoomStateResponse {
	room: MultiplayerRoom;
	gameState: GameState;
}

export interface MultiplayerAnswerResult {
	room: MultiplayerRoom;
	isCorrect: boolean;
	scoreEarned: number;
	leaderboard?: Player[];
}

export interface QuestionEndResult {
	results: QuestionResult[];
	leaderboard: Player[];
	room: MultiplayerRoom;
}
