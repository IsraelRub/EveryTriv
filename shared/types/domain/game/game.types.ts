/**
 * Game-related types for EveryTriv
 *
 * @module GameTypes
 * @description Type definitions for game entities, history, and game modes
 * @used_by server: server/src/features/game/entities/game.entity.ts (Game entity), server/src/features/game/entities/game-history.entity.ts (GameHistory entity), client: client/src/components/game/TriviaGame.tsx (game state), client/src/views/gameHistory/GameHistory.tsx (game history display)
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
	/** Game topic */
	topic: string;
	/** Game difficulty level */
	difficulty: DifficultyLevel;
	/** Game mode */
	gameMode: GameMode;
	/** User ID who played the game */
	userId: string;
	/** Game score */
	score: number;
}

/**
 * Game history entry interface
 * @interface GameHistoryEntry
 * @description Complete game history entry with question details
 * @used_by client: client/src/views/gameHistory/GameHistory.tsx (game history display), client/src/services/game/gameHistory.service.ts (game history operations)
 */
export interface GameHistoryEntry extends BaseGameEntity {
	/** Question details */
	questionsData: Array<{
		/** Question text */
		question: string;
		/** User's answer */
		userAnswer: string;
		/** Correct answer */
		correctAnswer: string;
		/** Whether answer was correct */
		isCorrect: boolean;
		/** Time spent on question */
		timeSpent?: number;
	}>;
	/** Number of correct answers */
	correctAnswers: number;
	/** Total number of questions */
	totalQuestions: number;
	/** Time spent in game */
	timeSpent?: number;
	/** Credits used */
	creditsUsed?: number;
}

/**
 * Game history request interface
 * @interface GameHistoryRequest
 * @description Request payload for saving game history
 * @used_by client: client/src/services/game/gameHistory.service.ts (saveGameResult)
 */
export interface GameHistoryRequest {
	/** Game topic */
	topic: string;
	/** Game difficulty */
	difficulty: DifficultyLevel;
	/** Game mode */
	gameMode: GameMode;
	/** User ID */
	userId: string;
	/** Game score */
	score: number;
	/** Total questions in game */
	totalQuestions: number;
	/** Number of correct answers */
	correctAnswers: number;
	/** Time spent in game (seconds) */
	timeSpent?: number;
	/** Credits used */
	creditsUsed?: number;
	/** Question data */
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
	/** User ID */
	userId: string;
	/** Username */
	username: string;
	/** User avatar URL */
	avatar?: string;
	/** User full name */
	fullName?: string;
	/** User first name */
	firstName?: string;
	/** User last name */
	lastName?: string;
	/** User score */
	score: number;
	/** User rank */
	rank: number;
	/** Games played */
	gamesPlayed: number;
	/** Average score */
	averageScore: number;
	/** Best score */
	bestScore: number;
	/** Total correct answers */
	totalCorrectAnswers: number;
	/** Success rate percentage */
	successRate: number;
	/** Last played date */
	lastPlayed: Date;
}

/**
 * User rank data interface
 * @interface UserRankData
 * @description User ranking information
 * @used_by client: client/src/views/leaderboard/Leaderboard.tsx (user rank display), client/src/services/game/gameHistory.service.ts (getUserRank)
 */
export interface UserRankData {
	/** User ID */
	userId: string;
	/** User rank */
	rank: number;
	/** User score */
	score: number;
	/** Total users */
	totalUsers: number;
	/** Percentile */
	percentile: number;
}

/**
 * User stats data interface
 * @interface UserStatsData
 * @description User statistics data
 * @used_by client: client/src/views/leaderboard/Leaderboard.tsx (user stats display), client/src/services/game/gameHistory.service.ts (getUserStats)
 */
export interface UserStatsData {
	/** User ID */
	userId: string;
	/** Total games played */
	totalGames: number;
	/** Games played (alias) */
	gamesPlayed?: number;
	/** Total questions answered */
	totalQuestions: number;
	/** Total correct answers */
	totalCorrectAnswers: number;
	/** Correct answers (alias) */
	correctAnswers?: number;
	/** Success rate percentage */
	successRate: number;
	/** Average score */
	averageScore: number;
	/** Best score */
	bestScore: number;
	/** Total play time in minutes */
	totalPlayTime: number;
	/** Favorite topic */
	favoriteTopic: string;
	/** Current streak */
	currentStreak: number;
	/** Best streak */
	bestStreak: number;
}

/**
 * Game mode configuration interface
 * @interface GameModeConfig
 * @description Configuration for different game modes
 * @used_by client: client/src/hooks/layers/business/useGameMode.ts (game mode management), client/src/components/gameMode/GameMode.tsx (game mode selection)
 */
export interface GameModeConfig {
	/** Game mode */
	mode: GameMode;
	/** Time limit in seconds */
	timeLimit?: number;
	/** Question limit */
	questionLimit?: number;
	/** Whether game is over */
	isGameOver: boolean;
	/** Timer configuration */
	timer: {
		/** Whether timer is running */
		isRunning: boolean;
		/** Start time */
		startTime: number | null;
		/** Time elapsed */
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
	/** Current question index */
	currentQuestionIndex: number;
	/** Total questions */
	totalQuestions: number;
	/** Current score */
	score: number;
	/** Game status */
	status: GameStatus;
	/** Time remaining */
	timeRemaining?: number;
	/** Questions answered */
	questionsAnswered: number;
	/** Correct answers */
	correctAnswers: number;
}

/**
 * Game result interface
 * @interface GameResult
 * @description Final game result
 * @used_by client: client/src/components/game/TriviaGame.tsx (game completion), client/src/views/gameHistory/GameHistory.tsx (game result display)
 */
export interface GameResult {
	/** Final score */
	score: number;
	/** Total questions */
	totalQuestions: number;
	/** Correct answers */
	correctAnswers: number;
	/** Success rate */
	successRate: number;
	/** Time spent */
	timeSpent: number;
	/** Game mode */
	gameMode: GameMode;
	/** Difficulty */
	difficulty: DifficultyLevel;
	/** Topic */
	topic: string;
}

/**
 * Game settings interface
 * @interface GameSettings
 * @description Game configuration settings
 * @used_by client: client/src/components/gameMode/GameMode.tsx (game settings), client/src/hooks/layers/business/useGameMode.ts (game configuration)
 */
export interface GameSettings {
	/** Game mode */
	mode: GameMode;
	/** Difficulty level */
	difficulty: DifficultyLevel;
	/** Topic */
	topic: string;
	/** Time limit */
	timeLimit?: number;
	/** Question limit */
	questionLimit?: number;
	/** Sound enabled */
	soundEnabled: boolean;
	/** Animations enabled */
	animationsEnabled: boolean;
}

/**
 * Game progress interface
 * @interface GameProgress
 * @description Game progress tracking
 * @used_by client: client/src/components/game/TriviaGame.tsx (progress tracking), client/src/views/gameHistory/GameHistory.tsx (progress display)
 */
export interface GameProgress {
	/** Current question */
	currentQuestion: number;
	/** Total questions */
	totalQuestions: number;
	/** Progress percentage */
	progress: number;
	/** Time elapsed */
	timeElapsed: number;
	/** Time remaining */
	timeRemaining?: number;
	/** Score */
	score: number;
	/** Streak */
	streak: number;
}

/**
 * Question count interface
 * @interface QuestionCount
 * @description Question count configuration
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface QuestionCount {
	/** Minimum questions */
	min: number;
	/** Maximum questions */
	max: number;
	/** Default questions */
	default: number;
}

/**
 * Queue item interface
 * @interface QueueItem
 * @description Queue item for processing
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface QueueItem {
	/** Item ID */
	id: string;
	/** Item type */
	type: string;
	/** Item data */
	data: Record<string, unknown>;
	/** Priority */
	priority: number;
	/** Created at */
	createdAt: Date;
	/** Processed at */
	processedAt?: Date;
}

/**
 * Queue stats interface
 * @interface QueueStats
 * @description Queue statistics
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface QueueStats {
	/** Total items */
	totalItems: number;
	/** Pending items */
	pendingItems: number;
	/** Processed items */
	processedItems: number;
	/** Failed items */
	failedItems: number;
	/** Average processing time */
	averageProcessingTime: number;
}

/**
 * Quiz history data interface
 * @interface QuizHistoryData
 * @description Quiz history data
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface QuizHistoryData {
	/** Quiz ID */
	quizId: string;
	/** User ID */
	userId: string;
	/** Quiz data */
	quizData: Record<string, unknown>;
	/** Created at */
	createdAt: Date;
	/** Updated at */
	updatedAt: Date;
}

/**
 * Saved quiz history interface
 * @interface SavedQuizHistory
 * @description Saved quiz history
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface SavedQuizHistory {
	/** History ID */
	historyId: string;
	/** Quiz ID */
	quizId: string;
	/** User ID */
	userId: string;
	/** Quiz data */
	quizData: Record<string, unknown>;
	/** Created at */
	createdAt: Date;
	/** Updated at */
	updatedAt: Date;
}

/**
 * Trivia history request interface
 * @interface TriviaHistoryRequest
 * @description Request for trivia history
 * @used_by server: server/src/features/game/logic/triviaGeneration.service.ts
 */
export interface TriviaHistoryRequest {
	/** User ID */
	userId: string;
	/** Topic */
	topic?: string;
	/** Difficulty */
	difficulty?: string;
	/** Date range */
	dateRange?: {
		start: Date;
		end: Date;
	};
	/** Limit */
	limit?: number;
	/** Offset */
	offset?: number;
}

/**
 * Create game history data interface
 * @interface CreateGameHistoryData
 * @description Data for creating game history
 * @used_by server: server/src/features/game/game.service.ts (createGameHistory method)
 */
export interface CreateGameHistoryData {
	/** User ID */
	userId: string;
	/** Game topic */
	topic: string;
	/** Game difficulty */
	difficulty: DifficultyLevel;
	/** Game mode */
	gameMode: GameMode;
	/** Game score */
	score: number;
	/** Total questions */
	totalQuestions: number;
	/** Correct answers */
	correctAnswers: number;
	/** Time spent */
	timeSpent: number;
	/** Credits used */
	creditsUsed: number;
	/** Question data */
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
	/** Total games played */
	totalGames: number;
	/** Total questions answered */
	totalQuestions: number;
	/** Total correct answers */
	totalCorrectAnswers: number;
	/** Success rate */
	successRate: number;
	/** Average score */
	averageScore: number;
	/** Best score */
	bestScore: number;
	/** Total play time */
	totalPlayTime: number;
	/** Current streak */
	currentStreak: number;
	/** Best streak */
	bestStreak: number;
	/** Favorite topic */
	favoriteTopic: string;
	/** Favorite difficulty */
	favoriteDifficulty: string;
	/** Last played */
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
