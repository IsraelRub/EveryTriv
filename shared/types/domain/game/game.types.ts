/**
 * Game-related types for EveryTriv
 *
 * @module GameTypes
 * @description Type definitions for game entities, history, and game modes
 * @used_by client/src/components/game/TriviaGame.tsx, client/src/views/gameHistory
 */
import { DifficultyLevel, GameMode } from '../../../constants/core/game.constants';
import type { BaseEntity } from '../../core/data.types';

/**
 * Game status types
 */
export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'abandoned';

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
	questionsData: Array<{
		question: string;
		userAnswer: string;
		correctAnswer: string;
		isCorrect: boolean;
		timeSpent?: number;
	}>;
	correctAnswers: number;
	totalQuestions: number;
	timeSpent?: number;
	creditsUsed?: number;
}

/**
 * Game history request interface
 * @interface GameHistoryRequest
 * @description Request payload for saving game history
 * @used_by client: client/src/services/game/gameHistory.service.ts (saveGameResult)
 */
export interface GameHistoryRequest {
	topic: string;
	difficulty: DifficultyLevel;
	gameMode: GameMode;
	userId: string;
	score: number;
	totalQuestions: number;
	correctAnswers: number;
	timeSpent?: number;
	creditsUsed?: number;
	questionsData?: Array<{
		question: string;
		userAnswer: string;
		correctAnswer: string;
		isCorrect: boolean;
		timeSpent?: number;
	}>;
}

/**
 * Leaderboard entry interface
 * @interface LeaderboardEntry
 * @description Leaderboard entry with user ranking information
 * @used_by client: client/src/views/leaderboard/Leaderboard.tsx (leaderboard display), client/src/services/game/gameHistory.service.ts (getLeaderboard)
 */
export interface LeaderboardEntry {
	userId: string;
	username: string;
	avatar?: string;
	fullName?: string;
	firstName?: string;
	lastName?: string;
	score: number;
	rank: number;
	gamesPlayed: number;
	averageScore: number;
	bestScore: number;
	totalCorrectAnswers: number;
	successRate: number;
	lastPlayed: Date;
}

/**
 * User rank data interface
 * @interface UserRankData
 * @description User ranking information
 * @used_by client: client/src/views/leaderboard/Leaderboard.tsx (user rank display), client/src/services/game/gameHistory.service.ts (getUserRank)
 */
export interface UserRankData {
	userId: string;
	rank: number;
	score: number;
	totalUsers: number;
	percentile: number;
}

/**
 * User stats data interface
 * @interface UserStatsData
 * @description User statistics data
 * @used_by client: client/src/views/leaderboard/Leaderboard.tsx (user stats display), client/src/services/game/gameHistory.service.ts (getUserStats)
 */
export interface UserStatsData {
	userId: string;
	totalGames: number;
	gamesPlayed?: number;
	totalQuestions: number;
	totalCorrectAnswers: number;
	correctAnswers?: number;
	successRate: number;
	averageScore: number;
	bestScore: number;
	totalPlayTime: number;
	favoriteTopic: string;
	currentStreak: number;
	bestStreak: number;
}

/**
 * Game mode configuration interface
 * @interface GameModeConfig
 * @description Configuration for different game modes
 * @used_by client: client/src/hooks/layers/business/useGameMode.ts (game mode management), client/src/components/gameMode/GameMode.tsx (game mode selection)
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
	};
}

/**
 * Game state interface
 * @interface GameState
 * @description Current game state
 * @used_by client: client/src/components/game/TriviaGame.tsx (game state management), client/src/hooks/layers/business/useGameMode.ts (game state)
 */
export interface GameState {
	currentQuestionIndex: number;
	totalQuestions: number;
	score: number;
	status: GameStatus;
	timeRemaining?: number;
	questionsAnswered: number;
	correctAnswers: number;
}

/**
 * Game result interface
 * @interface GameResult
 * @description Final game result
 * @used_by client: client/src/components/game/TriviaGame.tsx (game completion), client/src/views/gameHistory/GameHistory.tsx (game result display)
 */
export interface GameResult {
	score: number;
	totalQuestions: number;
	correctAnswers: number;
	successRate: number;
	timeSpent: number;
	gameMode: GameMode;
	difficulty: DifficultyLevel;
	topic: string;
}

/**
 * Game settings interface
 * @interface GameSettings
 * @description Game configuration settings
 * @used_by client: client/src/components/gameMode/GameMode.tsx (game settings), client/src/hooks/layers/business/useGameMode.ts (game configuration)
 */
export interface GameSettings {
	mode: GameMode;
	difficulty: DifficultyLevel;
	topic: string;
	timeLimit?: number;
	questionLimit?: number;
	soundEnabled: boolean;
	animationsEnabled: boolean;
}

/**
 * Game progress interface
 * @interface GameProgress
 * @description Game progress tracking
 * @used_by client: client/src/components/game/TriviaGame.tsx (progress tracking), client/src/views/gameHistory/GameHistory.tsx (progress display)
 */
export interface GameProgress {
	currentQuestion: number;
	totalQuestions: number;
	progress: number;
	timeElapsed: number;
	timeRemaining?: number;
	score: number;
	streak: number;
}

/**
 * Question count interface
 * @interface QuestionCount
 * @description Question count configuration
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface QuestionCount {
	min: number;
	max: number;
	default: number;
}

/**
 * Queue item interface
 * @interface QueueItem
 * @description Queue item for processing
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface QueueItem {
	id: string;
	type: string;
	data: Record<string, unknown>;
	priority: number;
	createdAt: Date;
	processedAt?: Date;
}

/**
 * Queue stats interface
 * @interface QueueStats
 * @description Queue statistics
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface QueueStats {
	totalItems: number;
	pendingItems: number;
	processedItems: number;
	failedItems: number;
	averageProcessingTime: number;
}

/**
 * Quiz history data interface
 * @interface QuizHistoryData
 * @description Quiz history data
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface QuizHistoryData {
	quizId: string;
	userId: string;
	quizData: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Saved quiz history interface
 * @interface SavedQuizHistory
 * @description Saved quiz history
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface SavedQuizHistory {
	historyId: string;
	quizId: string;
	userId: string;
	quizData: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Trivia history request interface
 * @interface TriviaHistoryRequest
 * @description Request for trivia history
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface TriviaHistoryRequest {
	userId: string;
	topic?: string;
	difficulty?: string;
	dateRange?: {
		start: Date;
		end: Date;
	};
	limit?: number;
	offset?: number;
}

/**
 * Create game history data interface
 * @interface CreateGameHistoryData
 * @description Data for creating game history
 * @used_by server: server/src/features/game/game.service.ts (createGameHistory method)
 */
export interface CreateGameHistoryData {
	userId: string;
	topic: string;
	difficulty: DifficultyLevel;
	gameMode: GameMode;
	score: number;
	totalQuestions: number;
	correctAnswers: number;
	timeSpent: number;
	creditsUsed: number;
	questionsData: Array<{
		question: string;
		userAnswer: string;
		correctAnswer: string;
		isCorrect: boolean;
		timeSpent?: number;
	}>;
}

/**
 * Game stats interface
 * @interface GameStats
 * @description Game statistics
 * @used_by server: server/src/features/game/game.service.ts (getGameStats method)
 */
export interface GameStats {
	totalGames: number;
	totalQuestions: number;
	totalCorrectAnswers: number;
	successRate: number;
	averageScore: number;
	bestScore: number;
	totalPlayTime: number;
	currentStreak: number;
	bestStreak: number;
	favoriteTopic: string;
	favoriteDifficulty: string;
	lastPlayed: Date;
}

/**
 * User score data interface
 * @interface UserScoreData
 * @description User's score and statistics data
 * @used_by server: server/src/features/game/game.service.ts (getUserScore method)
 */

// Game History Creation Data
export interface GameHistoryCreationData {
	userId: string;
	score: number;
	totalQuestions: number;
	correctAnswers: number;
	difficulty: string;
	topic: string;
	gameMode: string;
	timeSpent: number;
	creditsUsed: number;
	questionsData: Array<{
		questionId: string;
		userAnswer: string;
		correctAnswer: string;
		isCorrect: boolean;
		timeSpent: number;
	}>;
}
