/**
 * Game-related types for EveryTriv
 *
 * @module GameTypes
 * @description Type definitions for game entities, history, and game modes
 * @used_by client/src/components/game/TriviaGame.tsx, client/src/views/gameHistory
 */
import { DifficultyLevel, GameMode } from '../../../constants';
import type { BaseEntity } from '../../core/data.types';
import type { QuestionData } from '../../infrastructure/api.types';

/**
 * Game status types
 */
export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'abandoned';

/**
 * Base game statistics interface
 * @interface BaseGameStatistics
 * @description Common game statistics fields shared across multiple interfaces
 */
export interface BaseGameStatistics {
	totalGames: number;
	totalQuestions: number;
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
	difficulty: DifficultyLevel;
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
	totalQuestions: number;
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
	avatar?: string;
	rank: number;
	gamesPlayed: number;
	lastPlayed: Date;
	successRate: number;
	totalGames: number;
	totalQuestions: number;
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
	questionLimit?: number;
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
