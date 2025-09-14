/**
 * Trivia-related types for EveryTriv
 *
 * @module TriviaTypes
 * @description Type definitions for trivia questions, answers, and trivia-related entities
 * @used_by server/src/features/trivia/entities/trivia-question.entity.ts, server/src/features/trivia/entities/trivia-answer.entity.ts, client/src/components/game/TriviaForm.tsx, client/src/components/game/TriviaGame.tsx
 */
import type { BaseEntity } from '../../core/data.types';

/**
 * Trivia question interface
 * @interface TriviaQuestion
 * @description Trivia question with answers and metadata
 * @used_by server/src/features/trivia/entities/trivia-question.entity.ts, client/src/components/game/TriviaForm.tsx, client/src/components/game/TriviaGame.tsx
 */
export interface TriviaQuestion extends BaseEntity {
	/** Question text */
	question: string;
	/** Answer options */
	answers: TriviaAnswer[];
	/** Index of correct answer */
	correctAnswerIndex: number;
	/** Question difficulty */
	difficulty: string;
	/** Question topic */
	topic: string;
	/** Question category */
	category?: string;
	/** Question explanation */
	explanation?: string;
	/** Question source */
	source?: string;
	/** Question tags */
	tags?: string[];
	/** Question rating */
	rating?: number;
	/** Number of times answered */
	timesAnswered?: number;
	/** Success rate */
	successRate?: number;
	/** Game metadata */
	metadata?: Record<string, any>;
}

/**
 * Trivia answer interface
 * @interface TriviaAnswer
 * @description Trivia answer with metadata
 * @used_by server/src/features/trivia/entities/trivia-answer.entity.ts, client/src/components/game/TriviaForm.tsx, client/src/components/game/TriviaGame.tsx
 */
export interface TriviaAnswer {
	/** Answer text */
	text: string;
	/** Whether this is the correct answer */
	isCorrect: boolean;
	/** Answer explanation */
	explanation?: string;
	/** Answer order */
	order?: number;
	/** Question ID */
	questionId?: string;
}

/**
 * Trivia request interface
 * @interface TriviaRequest
 * @description Request payload for trivia questions
 * @used_by client/src/services/api.service.ts, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaRequest {
	/** Number of questions */
	question_count: number;
	/** Question topic */
	topic: string;
	/** Question difficulty */
	difficulty: string;
	/** Question category */
	category?: string;
	/** Language */
	language?: string;
	/** User ID */
	userId?: string;
	/** Game mode */
	gameMode?: string;
	/** Time limit */
	timeLimit?: number;
	/** Question limit */
	questionLimit?: number;
}

/**
 * Trivia response interface
 * @interface TriviaResponse
 * @description Response payload for trivia questions
 * @used_by client/src/services/api.service.ts, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaResponse {
	/** Trivia questions */
	questions: TriviaQuestion[];
	/** Total questions available */
	totalQuestions: number;
	/** Request metadata */
	metadata: {
		/** Request timestamp */
		timestamp: string;
		/** Request ID */
		requestId: string;
		/** Processing time */
		processingTime: number;
		/** Provider used */
		provider: string;
		/** Cache status */
		cached: boolean;
	};
}

/**
 * Answer result interface
 * @interface AnswerResult
 * @description Result of answering a trivia question
 * @used_by client/src/components/game/TriviaForm.tsx, client/src/components/game/TriviaGame.tsx, server/src/features/game/game.service.ts
 */
export interface AnswerResult {
	/** Question ID */
	questionId: string;
	/** User's answer */
	userAnswer: string;
	/** Correct answer */
	correctAnswer: string;
	/** Whether answer was correct */
	isCorrect: boolean;
	/** Time spent on question */
	timeSpent: number;
	/** Points earned */
	pointsEarned: number;
	/** Total score after this answer */
	totalScore: number;
	/** Explanation */
	explanation?: string;
	/** Feedback */
	feedback: string;
}

/**
 * Trivia session interface
 * @interface TriviaSession
 * @description Trivia game session
 * @used_by client/src/components/game/TriviaGame.tsx, client/src/hooks/layers/business/useGameMode.ts
 */
export interface TriviaSession {
	/** Session ID */
	sessionId: string;
	/** User ID */
	userId: string;
	/** Questions */
	questions: TriviaQuestion[];
	currentQuestionIndex: number;
	/** Answers */
	answers: AnswerResult[];
	/** Start time */
	startTime: Date;
	/** End time */
	endTime?: Date;
	/** Status */
	status: 'active' | 'completed' | 'abandoned';
	/** Score */
	score: number;
	/** Time limit */
	timeLimit?: number;
	/** Question limit */
	questionLimit?: number;
}

/**
 * Trivia category interface
 * @interface TriviaCategory
 * @description Trivia question category
 * @used_by client/src/components/gameMode/GameMode.tsx, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaCategory {
	/** Category ID */
	id: string;
	/** Category name */
	name: string;
	/** Category description */
	description?: string;
	/** Category icon */
	icon?: string;
	/** Number of questions */
	questionCount: number;
	/** Category color */
	color?: string;
	/** Category order */
	order: number;
	/** Whether category is active */
	isActive: boolean;
}

/**
 * Trivia difficulty interface
 * @interface TriviaDifficulty
 * @description Trivia difficulty level
 * @used_by client/src/components/gameMode/GameMode.tsx, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaDifficulty {
	/** Difficulty ID */
	id: string;
	/** Difficulty name */
	name: string;
	/** Difficulty description */
	description?: string;
	/** Difficulty level */
	level: number;
	/** Difficulty color */
	color?: string;
	/** Number of questions */
	questionCount: number;
	/** Whether difficulty is active */
	isActive: boolean;
}

/**
 * Trivia topic interface
 * @interface TriviaTopic
 * @description Trivia question topic
 * @used_by client/src/components/gameMode/GameMode.tsx, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaTopic {
	/** Topic ID */
	id: string;
	/** Topic name */
	name: string;
	/** Topic description */
	description?: string;
	/** Topic icon */
	icon?: string;
	/** Number of questions */
	questionCount: number;
	/** Topic color */
	color?: string;
	/** Topic order */
	order: number;
	/** Whether topic is active */
	isActive: boolean;
	/** Topic category */
	category?: string;
}

/**
 * Trivia statistics interface
 * @interface TriviaStatistics
 * @description Trivia statistics data
 * @used_by client/src/views/leaderboard/Leaderboard.tsx, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaStatistics {
	/** Total questions */
	totalQuestions: number;
	/** Total correct answers */
	totalCorrectAnswers: number;
	/** Success rate */
	successRate: number;
	/** Average time per question */
	averageTimePerQuestion: number;
	/** Best streak */
	bestStreak: number;
	currentStreak: number;
	/** Favorite topic */
	favoriteTopic: string;
	/** Favorite difficulty */
	favoriteDifficulty: string;
	/** Total play time */
	totalPlayTime: number;
	/** Last played */
	lastPlayed: Date;
}

/**
 * Trivia leaderboard entry interface
 * @interface TriviaLeaderboardEntry
 * @description Trivia leaderboard entry
 * @used_by client/src/views/leaderboard/Leaderboard.tsx, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaLeaderboardEntry {
	/** User ID */
	userId: string;
	/** Username */
	username: string;
	/** Score */
	score: number;
	/** Rank */
	rank: number;
	/** Games played */
	gamesPlayed: number;
	/** Success rate */
	successRate: number;
	/** Best streak */
	bestStreak: number;
	/** Total play time */
	totalPlayTime: number;
	/** Last played */
	lastPlayed: Date;
}
