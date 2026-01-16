// Game-related types for EveryTriv.
import { GameMode } from '../../../constants';
import type { BaseEntity, CountRecord, OffsetPagination } from '../../core';
import type { QuestionData } from '../../infrastructure/api.types';
import type { BaseAnswerPayload, BaseTriviaParams, GameDifficulty } from './trivia.types';

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
	questionsData: QuestionData[];
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
	questionsData: QuestionData[];
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

export interface UserStatsData extends BaseGameStatistics, BaseScoreData {
	userId: string;
	correctAnswers: number;
	favoriteTopic: string;
	gamesPlayed?: number;
	currentStreak: number;
	bestStreak: number;
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

export interface GameConfig
	extends BaseTriviaParams,
		Pick<GameModeConfig, 'mode' | 'timeLimit' | 'maxQuestionsPerGame'> {
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

export interface AdminStatisticsRaw extends AdminStatisticsBase {
	lastActivity: Date | null;
}

export interface GameHistoryResponse {
	userId: string;
	totalGames: number;
	games: GameHistoryEntry[];
}

export interface ClearOperationResponse {
	success: boolean;
	message: string;
	deletedCount?: number;
}

export interface SubmitAnswerToSessionParams extends BaseAnswerPayload {
	gameId: string;
	answer: number;
}
