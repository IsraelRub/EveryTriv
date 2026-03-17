// Game-related types for EveryTriv.
import { GameMode } from '../../../constants';
import type { BaseEntity, BaseOperationResponse, CountRecord, OffsetPagination } from '../../core';
import type { AnswerHistory } from '../../infrastructure';
import type { GameDifficulty } from './trivia.types';

export interface BaseGameStatistics {
	totalGames: number;
	totalQuestionsAnswered: number;
	successRate: number;
	averageScore: number;
	bestScore: number;
	totalPlayTime: number;
}

export interface BaseScoreData {
	score: number;
	averageScore: number;
	bestScore: number;
}

export interface BaseGameEntity extends BaseEntity {
	topic: string;
	difficulty: GameDifficulty;
	gameMode: GameMode;
	userId: string;
	score: number;
}

export interface GameHistoryEntry extends BaseGameEntity {
	answerHistory: AnswerHistory[];
	correctAnswers: number;
	gameQuestionCount: number;
	timeSpent?: number;
	creditsUsed?: number;
}

export interface SaveGameHistoryData {
	score: number;
	gameQuestionCount: number;
	correctAnswers: number;
	difficulty: GameDifficulty;
	gameMode: GameMode;
	creditsUsed: number;
	answerHistory: AnswerHistory[];
	clientMutationId?: string;
	topic?: string;
	timeSpent?: number;
}

export interface LeaderboardEntry extends BaseScoreData {
	userId: string;
	email: string;
	firstName?: string;
	lastName?: string;
	avatar?: number;
	avatarUrl?: string;
	rank: number;
	gamesPlayed: number;
	lastPlayed: Date;
	successRate: number;
	totalGames: number;
	totalQuestionsAnswered: number;
	totalPlayTime: number;
}

export interface UserRankData {
	userId?: string;
	rank: number;
	score: number;
	totalUsers: number;
	percentile: number;
}

export interface GameModeConfig {
	mode: GameMode;
	timeLimit?: number;
	maxQuestionsPerGame?: number;
	isGameOver: boolean;
	timer: {
		isRunning: boolean;
		startTime: number | null;
		timeElapsed: number;
		timeRemaining?: number;
		endTime?: number;
		isPaused?: boolean;
		lowTimeWarning?: boolean;
	};
}

export interface GameConfig extends Pick<GameModeConfig, 'mode' | 'timeLimit' | 'maxQuestionsPerGame'> {
	topic?: string;
	difficulty?: GameDifficulty;
	count?: number;
	answerCount?: number;
	settings?: {
		showTimer?: boolean;
		showProgress?: boolean;
		allowBackNavigation?: boolean;
	};
}

export interface LeaderboardResponse {
	leaderboard: LeaderboardEntry[];
	pagination: OffsetPagination;
	period: string;
}

export interface CategoryStatistics {
	totalQuestionsAnswered: number;
	correctAnswers: number;
	score: number;
	successRate: number;
	lastPlayed: Date;
}

export interface LeaderboardStats {
	activeUsers: number;
	averageScore: number;
	averageGames: number;
}

export interface AdminStatisticsBase {
	totalGames: number;
	averageScore: number | null;
	bestScore: number | null;
	totalQuestionsAnswered: number;
	correctAnswers: number;
}

export interface AdminGameStatistics extends Omit<AdminStatisticsBase, 'averageScore' | 'bestScore' | 'lastActivity'> {
	averageScore: number;
	bestScore: number;
	accuracy: number;
	activePlayers24h: number;
	topics: CountRecord;
	difficultyDistribution: CountRecord;
	lastActivity: string | null;
}

export interface GameHistoryResponse {
	userId: string;
	totalGames: number;
	games: GameHistoryEntry[];
}

export interface ClearOperationResponse extends BaseOperationResponse {
	deletedCount?: number;
}

export interface SubmitAnswerToSessionParams {
	gameId: string;
	questionId: string;
	answer: number;
	timeSpent: number;
}

export interface GameSessionValidationResponse {
	isValid: boolean;
	session?: unknown;
}

export interface StartGameSessionParams {
	gameId: string;
	topic: string;
	difficulty: GameDifficulty;
	gameMode: GameMode;
}

export interface GameSessionStartResponse {
	gameId: string;
	status: string;
}
