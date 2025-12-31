/**
 * Game-related types for EveryTriv
 *
 * @module GameTypes
 * @description Type definitions for game entities, history, and game modes
 * @used_by client/src/components/game/TriviaGame.tsx, client/src/views/gameHistory
 */
import { GameMode } from '../../../constants';
import type { OffsetPagination, BaseEntity, CountRecord } from '../../core';
import type { QuestionData } from '../../infrastructure/api.types';
import type { GameDifficulty } from './trivia.types';

/**
 * Base game statistics interface
 * @interface BaseGameStatistics
 * @description Common game statistics fields shared across multiple interfaces
 */
export interface BaseGameStatistics {
	totalGames: number;
	totalQuestionsAnswered: number;
	successRate: number;
	averageScore: number;
	bestScore: number;
	totalPlayTime: number;
}

/**
 * Base score data interface
 * @interface BaseScoreData
 * @description Common score-related fields shared across multiple interfaces
 */
export interface BaseScoreData {
	score: number;
	averageScore: number;
	bestScore: number;
}

/**
 * Base game entity interface
 * @interface BaseGameEntity
 * @description Base interface for game-related entities with common fields
 * @used_by server: server/src/features/game/entities/game.entity.ts (Game entity), server/src/features/game/entities/game-history.entity.ts (GameHistory entity)
 */
export interface BaseGameEntity extends BaseEntity {
	topic: string;
	difficulty: GameDifficulty;
	gameMode: GameMode;
	userId: string;
	score: number;
}

/**
 * Game history entry interface
 * @interface GameHistoryEntry
 * @description Complete game history entry with question details
 * @used_by client: client/src/views/gameHistory/GameHistory.tsx (game history display), client/src/services/game/gameHistory.service.ts (game history operations)
 */
export interface GameHistoryEntry extends BaseGameEntity {
	questionsData: QuestionData[];
	correctAnswers: number;
	gameQuestionCount: number;
	timeSpent?: number;
	creditsUsed?: number;
}

/**
 * Leaderboard entry interface
 * @interface LeaderboardEntry
 * @description Leaderboard entry with user ranking information - combines user stats with user profile and ranking data
 * @used_by client: client/src/views/leaderboard/Leaderboard.tsx (leaderboard display), client/src/services/game/gameHistory.service.ts (getLeaderboard)
 */
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

/**
 * User rank data interface
 * @interface UserRankData
 * @description User ranking information
 * @used_by client: client/src/views/leaderboard/Leaderboard.tsx (user rank display), client/src/services/game/gameHistory.service.ts (getUserRank)
 */
export interface UserRankData {
	userId?: string;
	rank: number;
	score: number;
	totalUsers: number;
	percentile: number;
}

/**
 * User stats data type
 * @interface UserStatsData
 * @description User statistics data for client-side display - combines analytics data with game statistics
 * @used_by client: client/src/views/leaderboard/Leaderboard.tsx (user stats display), client/src/services/game/gameHistory.service.ts (getUserStats)
 */
export interface UserStatsData extends BaseGameStatistics, BaseScoreData {
	userId: string;
	correctAnswers: number;
	favoriteTopic: string;
	gamesPlayed?: number;
	currentStreak: number;
	bestStreak: number;
}

/**
 * Leaderboard statistics response interface
 * @interface LeaderboardStatsResponse
 * @description Statistics for leaderboard periods (weekly/monthly/yearly)
 * @used_by client: client/src/views/leaderboard/LeaderboardView.tsx (period comparison stats)
 */
export interface LeaderboardStatsResponse {
	activeUsers: number;
	averageScore: number;
	averageGames: number;
}

/**
 * Game mode configuration interface
 * @interface GameModeConfig
 * @description Unified configuration for game modes - includes both static configuration and dynamic game state
 * @used_by client: client/src/hooks/layers/business/useGameMode.ts (game mode management), client/src/components/gameMode/GameMode.tsx (game mode selection), client/src/views/home/HomeView.tsx (game state)
 */
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

/**
 * Game configuration interface
 * @interface GameConfig
 * @description Game configuration and setup
 * Extends BaseTriviaParams with game mode specific settings
 * @used_by client: client/src/hooks/layers/business/useGameLogic.ts, client/src/components/game-mode/GameMode.tsx
 */
export interface GameConfig {
	mode: GameMode;
	topic?: string;
	difficulty?: GameDifficulty;
	timeLimit?: number;
	maxQuestionsPerGame?: number;
	answerCount?: number;
	settings?: {
		showTimer?: boolean;
		showProgress?: boolean;
		allowBackNavigation?: boolean;
	};
}

/**
 * Leaderboard entry shape type alias
 * @type LeaderboardEntryShape
 * @description Type alias for LeaderboardEntry (for backward compatibility)
 */
export type LeaderboardEntryShape = LeaderboardEntry;

/**
 * Leaderboard response interface
 * @interface LeaderboardResponse
 * @description Response containing leaderboard entries and pagination
 */
export interface LeaderboardResponse {
	leaderboard: LeaderboardEntry[];
	pagination: OffsetPagination;
	period: string;
}

/**
 * Category statistics interface
 * @interface CategoryStatistics
 * @description Statistics for a category (topic or difficulty)
 */
export interface CategoryStatistics {
	totalQuestionsAnswered: number;
	correctAnswers: number;
	score: number;
	successRate: number;
	lastPlayed: Date;
}

/**
 * Leaderboard statistics interface
 * @interface LeaderboardStats
 * @description Statistics for leaderboard periods
 */
export interface LeaderboardStats {
	activeUsers: number;
	averageScore: number;
	averageGames: number;
}

/**
 * Admin game statistics interface
 * @interface AdminGameStatistics
 * @description Aggregated statistics for admin dashboard
 */
export interface AdminGameStatistics {
	totalGames: number;
	averageScore: number;
	bestScore: number;
	totalQuestionsAnswered: number;
	correctAnswers: number;
	accuracy: number;
	activePlayers24h: number;
	topics: CountRecord;
	difficultyDistribution: CountRecord;
	lastActivity: string | null;
}

/**
 * Admin statistics raw interface
 * @interface AdminStatisticsRaw
 * @description Raw statistics from database query
 */
export interface AdminStatisticsRaw {
	totalGames: number;
	averageScore: number | null;
	bestScore: number | null;
	totalQuestionsAnswered: number;
	correctAnswers: number;
	lastActivity: Date | null;
}

/**
 * Game history response interface
 * @interface GameHistoryResponse
 * @description Response containing user game history
 */
export interface GameHistoryResponse {
	userId: string;
	totalGames: number;
	games: GameHistoryEntry[];
}

/**
 * Clear operation response interface
 * @interface ClearOperationResponse
 * @description Response from clear operations
 */
export interface ClearOperationResponse {
	success: boolean;
	message: string;
	deletedCount?: number;
}
