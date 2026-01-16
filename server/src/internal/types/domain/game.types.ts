import type { Socket } from 'socket.io';

import { DifficultyLevel } from '@shared/constants';
import type {
	BaseCacheEntry,
	GameDifficulty,
	MultiplayerRoom,
	Player,
	SaveGameHistoryData,
	TokenPayload,
	TriviaAnswer,
	TriviaQuestion,
} from '@shared/types';

export interface RoomTimer {
	checkInterval: NodeJS.Timeout;
	timeoutId: NodeJS.Timeout;
}

export type RoomTimerMap = Record<string, RoomTimer>;

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

export interface TriviaQuestionMetadata {
	actualDifficulty: GameDifficulty;
	gameQuestionCount: number;
	customDifficultyMultiplier: number;
	mappedDifficulty: DifficultyLevel;
}

export interface QuestionCacheEntry extends BaseCacheEntry {
	question: TriviaQuestion;
	accessCount: number;
}

export type QuestionCacheMap = Record<string, QuestionCacheEntry>;

// Re-export shared types for convenience
export type { SavedGameConfiguration } from '@shared/types';

export interface StreakData {
	current: number;
	best: number;
}

export interface QuestionValidationPayload {
	question: string;
	answers: TriviaAnswer[];
	topic?: string;
	difficulty?: GameDifficulty;
}

export interface GetTriviaQuestionParams {
	topic: string;
	difficulty: GameDifficulty;
	questionsPerRequest: number;
	userId?: string;
	answerCount?: number;
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
