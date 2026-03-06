import type { Socket } from 'socket.io';

import { GameMode } from '@shared/constants';
import type { GameDifficulty, MultiplayerRoom, Player, SaveGameHistoryData, TokenPayload } from '@shared/types';

import { GameStatus } from '@internal/constants';

export interface QuestionSchedule {
	timeoutId: NodeJS.Timeout;
	checkInterval?: NodeJS.Timeout;
	roomId: string;
	startedAt: Date;
}

export interface SocketData {
	user?: TokenPayload;
	userId?: string;
	userRole?: string;
	roomId?: string;
}

export type TypedSocket = Socket & {
	data: SocketData;
};

export interface MultiplayerConnectionInfo {
	websocketUrl: string;
	namespace: string;
	transports: string[];
	requiresAuthentication: boolean;
	supportsSocketIo: boolean;
	description: string;
}

export interface RoomHttpResponse {
	room: MultiplayerRoom;
}

export interface LeaveRoomHttpResponse {
	status: 'room-closed' | 'player-left';
	remainingPlayers: number;
	room: MultiplayerRoom | null;
}

export type SubmitAnswerHttpResponse = {
	roomId: string;
	data: {
		userId: string;
		questionId: string;
		isCorrect: boolean;
		scoreEarned: number;
		leaderboard?: Player[];
	};
};

export interface StreakData {
	current: number;
	best: number;
}

export interface GetTriviaQuestionParams {
	topic: string;
	difficulty: GameDifficulty;
	questionsPerRequest: number;
	userId?: string;
	answerCount?: number;
	/** When provided with userId, server stores questionSnapshots in session for consistent answer evaluation. */
	gameId?: string;
}

export interface SubmitAnswerParams {
	questionId: string;
	answer: number;
	userId: string;
	timeSpent: number;
}

export interface UserGameHistoryParams {
	userId: string;
	limit?: number;
	offset?: number;
}

export interface GameConfigParams {
	defaultDifficulty?: GameDifficulty;
	defaultTopic?: string;
	questionsPerRequest?: number;
	timeLimit?: number;
	soundEnabled?: boolean;
	notifications?: boolean;
}

export interface SaveGameHistoryParams {
	userId: string;
	gameData: SaveGameHistoryData;
}

export interface CreditsParams {
	userId: string;
	credits: number;
}

export interface SaveGameConfigParams {
	userId: string;
	config: GameConfigParams;
}

export interface DeleteGameHistoryParams {
	userId: string;
	gameId: string;
}

export interface DifficultyCountRecord {
	difficulty: string;
	count: number;
}

export interface GameSessionQuestion {
	questionId: string;
	answer: number;
	timeSpent: number;
	isCorrect: boolean;
	score: number;
}

/** Snapshot of correctAnswerIndex per question for the game (post-shuffle). Used to evaluate answers consistently with client. */
export interface GameSessionQuestionSnapshot {
	correctAnswerIndex: number;
}

export interface GameSessionState {
	gameId: string;
	userId: string;
	topic: string;
	difficulty: GameDifficulty;
	gameMode: GameMode;
	startedAt: string;
	lastHeartbeat?: string;
	questions: GameSessionQuestion[];
	/** Optional: questionId -> snapshot (correctAnswerIndex after shuffle). Set when questions are returned to client. */
	questionSnapshots?: Record<string, GameSessionQuestionSnapshot>;
	currentScore: number;
	correctAnswers: number;
	totalQuestions: number;
	status: GameStatus;
}
