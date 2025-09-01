/**
 * Game-related types for EveryTriv
 * Shared between client and server
 *
 * @module GameTypes
 * @description Game logic, trivia questions, and game history type definitions
 * @used_by server: server/src/features/game, server/src/features/gameHistory, client: client/src/components/game, client/src/services/game
 */
import { GameMode } from '../constants';
import type { GameMetadata } from './metadata.types';

/**
 * Trivia answer interface
 * @interface TriviaAnswer
 * @description Represents a single answer option for a trivia question
 * @used_by server: server/src/shared/entities/trivia.entity.ts (TriviaEntity.answers), client: client/src/components/game/TriviaForm.tsx (answer rendering), client/src/hooks/layers/business/useTriviaValidation.ts (answer validation)
 */
export interface TriviaAnswer {
	/** Answer text content */
	text: string;
	/** Whether this answer is correct */
	isCorrect: boolean;
}

/**
 * Complete trivia question interface
 * @interface TriviaQuestion
 * @description Full trivia question with answers and metadata
 * @used_by server: server/src/features/game/game.service.ts (GameService.getTriviaQuestion), client: client/src/components/game/TriviaGame.tsx (question display), client/src/redux/features/gameSlice.ts (currentQuestion state)
 */
export interface TriviaQuestion {
	/** Unique question identifier */
	id: string;
	/** Question topic/category */
	topic: string;
	/** Difficulty level */
	difficulty: string;
	/** Question text */
	question: string;
	/** Array of answer options */
	answers: TriviaAnswer[];
	/** Index of the correct answer */
	correct_answer_index: number;
	/** Question creation timestamp */
	created_at: Date;
	/** Additional question metadata */
	metadata?: GameMetadata;
}

/**
 * Game history entry interface
 * @interface GameHistoryEntry
 * @description Complete game history record
 * @used_by server: server/src/shared/entities/game-history.entity.ts (GameHistoryEntity), client: client/src/services/api.service.ts (saveHistory), client/src/services/gameHistory.service.ts (GameHistoryService)
 */
export interface GameHistoryEntry {
	/** History entry ID */
	id: string;
	/** Associated user ID */
	user_id: string;
	/** Final game score */
	score: number;
	/** Total questions answered */
	total_questions: number;
	/** Number of correct answers */
	correct_answers: number;
	/** Difficulty level */
	difficulty: string;
	/** Topic name */
	topic: string;
	/** Game mode */
	game_mode: string;
	/** Time spent in seconds */
	time_spent: number;
	/** Credits consumed */
	credits_used: number;
	/** Question details */
	questions_data: Array<{
		/** Question text */
		question: string;
		/** User's answer */
		user_answer: string;
		/** Correct answer */
		correct_answer: string;
		/** Whether answer was correct */
		is_correct: boolean;
		/** Time spent on question */
		time_spent?: number;
	}>;
	/** Creation timestamp */
	created_at: Date;
}

/**
 * Trivia request interface for generating questions
 * @interface TriviaRequest
 * @description Request payload for trivia question generation
 * @used_by server: server/src/features/game/game.controller.ts (getTrivia), server/src/features/game/logic/trivia-generation.service.ts (generateQuestions), client: client/src/services/api.service.ts (getTrivia)
 */
export interface TriviaRequest extends Record<string, unknown> {
	/** Question topic/category */
	topic: string;
	/** Difficulty level */
	difficulty: string;
	/** Number of questions to generate */
	question_count: number;
	/** Optional user identifier */
	user_id?: string;
}

/**
 * Trivia history request interface for saving game results
 * @interface TriviaHistoryRequest
 * @description Request payload for saving trivia game history
 * @used_by server: server/src/features/gameHistory/gameHistory.controller.ts (saveHistory), client: client/src/services/gameHistory.service.ts (saveGameHistory)
 */
export interface TriviaHistoryRequest {
	/** Question topic */
	topic: string;
	/** Question difficulty */
	difficulty: string;
	/** Question text */
	question: string;
	/** Question answers */
	answers: TriviaAnswer[];
	/** User identifier */
	user_id: string;
	/** Whether the answer was correct */
	is_correct: boolean;
}

/**
 * Re-export GameMode enum to avoid circular imports
 * @used_by server: server/src/shared/entities/game-history.entity.ts (GameHistoryEntity.gameMode), client: client/src/components/game-mode/GameMode.tsx (mode selection), shared/constants/game.constants.ts (GameMode enum)
 */
export { GameMode };

/**
 * Analytics data interface for answer tracking
 * @interface AnalyticsAnswerData
 * @description Data structure for tracking user answer analytics
 * @used_by server: server/src/features/analytics/analytics.service.ts (recordAnswer), client: client/src/hooks/layers/business/useGameLogic.ts (trackAnswer), server/src/features/game/logic/game-validation.service.ts (validateAnswer)
 */
export interface AnalyticsAnswerData {
	/** Unique question identifier */
	questionId: string;
	/** User's selected answer */
	answer: string;
	/** Whether the answer was correct */
	isCorrect: boolean;
	/** Time spent answering in seconds */
	timeSpent: number;
	/** Points earned for the answer */
	points: number;
	/** Question topic */
	topic: string;
	/** Question difficulty level */
	difficulty: string;
}

/**
 * Answer result interface for immediate feedback
 * @interface AnswerResult
 * @description Result data returned after answering a question
 * @used_by server: server/src/features/game/logic/game-validation.service.ts (validateAnswer), client: client/src/components/game/TriviaForm.tsx (handleAnswer), client/src/hooks/layers/business/useGameLogic.ts (processAnswer)
 */
export interface AnswerResult {
	/** Whether the answer was correct */
	isCorrect: boolean;
	/** Points earned for the answer */
	points: number;
	/** The correct answer text */
	correctAnswer: string;
	/** Feedback message for the user */
	feedback: string;
}

/**
 * Game mode configuration interface
 * @interface GameModeConfig
 * @description Configuration for different game modes with timing and limits
 * @used_by server: server/src/features/game/game.service.ts (GameService.getGameMode), client: client/src/components/game-mode/GameMode.tsx (GameMode component), client/src/redux/features/gameModeSlice.ts (gameModeConfig state)
 */
export interface GameModeConfig {
	/** Current game mode type */
	mode: GameMode;
	/** Time limit for the game in milliseconds */
	timeLimit?: number;
	/** Maximum number of questions */
	questionLimit?: number;
	/** Remaining time in milliseconds */
	timeRemaining?: number;
	/** Remaining questions count */
	questionsRemaining?: number;
	/** Whether the game has ended */
	isGameOver: boolean;
	/** Timer state configuration */
	timer: {
		/** Whether the timer is currently running */
		isRunning: boolean;
		/** Game start timestamp */
		startTime: number | null;
		/** Elapsed time in milliseconds */
		timeElapsed: number;
	};
}

/**
 * Question count type definition
 * @type QuestionCount
 * @description Allowed number of questions per game session
 * @used_by client/game-logic, server/game/logic, shared/validation
 */
export type QuestionCount = 3 | 4 | 5;

/**
 * Game history creation data interface
 * @interface CreateGameHistoryData
 * @description Data structure for creating new game history records
 * @used_by client/services/gameHistory, server/controllers/gameHistory, server/entities
 */
export interface CreateGameHistoryData {
	/** User identifier (optional for client, required for server) */
	userId?: string;
	/** Final game score */
	score: number;
	/** Total number of questions in the game */
	totalQuestions: number;
	/** Number of correctly answered questions */
	correctAnswers: number;
	/** Game difficulty level */
	difficulty: string;
	/** Game topic (optional) */
	topic?: string;
	/** Game mode used */
	gameMode: GameMode;
	/** Total time spent in seconds */
	timeSpent?: number;
	/** Credits consumed during the game */
	creditsUsed: number;
	/** Detailed question-by-question data */
	questionsData: Array<{
		/** Question text */
		question: string;
		/** User's selected answer */
		userAnswer: string;
		/** Correct answer text */
		correctAnswer: string;
		/** Whether the user answered correctly */
		isCorrect: boolean;
		/** Time spent on this question in seconds */
		timeSpent?: number;
	}>;
}

/**
 * Difficulty statistics interface for tracking performance by difficulty
 * @interface DifficultyStats
 * @description Statistics for correct vs total answers by difficulty level
 * @used_by server/analytics, client/stats, server/game-history
 */
export interface DifficultyStats {
	/** Difficulty level mapped to correct/total stats */
	[key: string]: {
		/** Number of correct answers */
		correct: number;
		/** Total number of answers */
		total: number;
	};
}

/**
 * Comprehensive game statistics interface
 * @interface GameStats
 * @description Complete game performance statistics for a user
 * @used_by client/components/stats, server/analytics, client/services/gameHistory
 */
export interface GameStats {
	/** Total number of games played */
	totalGames: number;
	/** Total correct answers across all games */
	correctAnswers: number;
	/** Topics played with question counts */
	topicsPlayed: Record<string, number>;
	/** Performance statistics by difficulty */
	difficultyStats: Record<string, { correct: number; total: number }>;
	/** Current and best answer streaks */
	streaks: {
		/** Current correct answer streak */
		current: number;
		/** Best correct answer streak achieved */
		best: number;
	};
	/** Success rate breakdown by difficulty level */
	successRateByDifficulty: Record<string, { correct: number; total: number }>;
}

/**
 * Cache statistics interface (defined locally to avoid circular imports)
 * @interface CacheStats
 * @description Cache performance metrics
 * @used_by server/cache, server/metrics, server/analytics
 */
export interface CacheStats {
	/** Total number of cached keys */
	totalKeys: number;
	/** Cache hit rate percentage */
	hitRate: number;
	/** Cache miss rate percentage */
	missRate: number;
	/** Memory usage in bytes */
	memoryUsage: number;
	/** Number of cache evictions */
	evictions: number;
}

/**
 * Quiz history data interface for game session tracking
 * @interface QuizHistoryData
 * @description Data structure for tracking quiz session results
 * @used_by client/services/gameHistory, server/controllers/gameHistory
 */
export interface QuizHistoryData {
	/** User identifier */
	userId: string;
	/** Quiz topic */
	topic: string;
	/** Quiz difficulty level */
	difficulty: string;
	/** Final score achieved */
	score: number;
	/** Total number of questions */
	totalQuestions: number;
	/** Number of correct answers */
	correctAnswers: number;
	/** Time spent in seconds */
	timeSpent: number;
	/** Game mode used (optional) */
	gameMode?: string;
	/** Additional metadata (optional) */
	metadata?: GameMetadata;
}

/**
 * Saved quiz history interface with persistence details
 * @interface SavedQuizHistory
 * @description Persisted quiz history with save timestamp
 * @used_by client/services/gameHistory, server/entities/game-history
 */
export interface SavedQuizHistory {
	/** Unique history record identifier */
	id: string;
	/** User identifier */
	userId: string;
	/** Quiz topic */
	topic: string;
	/** Quiz difficulty level */
	difficulty: string;
	/** Final score achieved */
	score: number;
	/** Total number of questions */
	totalQuestions: number;
	/** Number of correct answers */
	correctAnswers: number;
	/** Time spent in seconds */
	timeSpent: number;
	/** Game mode used (optional) */
	gameMode?: string;
	/** Additional metadata (optional) */
	metadata?: GameMetadata;
	/** Timestamp when the record was saved */
	savedAt: string;
}

/**
 * Game history request interface (client-specific)
 * @interface GameHistoryRequest
 * @description Data structure for creating game history entries
 * @used_by client/src/services/gameHistory, client/src/components/game
 */
export interface GameHistoryRequest {
	/** Associated user ID */
	userId: string;
	/** Final game score */
	score: number;
	/** Total questions answered */
	totalQuestions: number;
	/** Correct answers count */
	correctAnswers: number;
	/** Difficulty level */
	difficulty: string;
	/** Topic name */
	topic?: string;
	/** Game mode */
	gameMode: string;
	/** Time spent in seconds */
	timeSpent?: number;
	/** Credits consumed */
	creditsUsed: number;
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
}
