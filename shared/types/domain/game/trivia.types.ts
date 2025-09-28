/**
 * Trivia-related types for EveryTriv
 *
 * @module TriviaTypes
 * @description Type definitions for trivia questions, answers, and trivia-related entities
 * @used_by client/src/components/game/TriviaForm.tsx, client/src/components/game/TriviaGame.tsx
 */
import type { BaseEntity, BasicValue } from '../../core/data.types';

/**
 * Trivia question interface
 * @interface TriviaQuestion
 * @description Trivia question with answers and metadata
 * @used_by client/src/components/game/TriviaForm.tsx, client/src/components/game/TriviaGame.tsx
 */
export interface TriviaQuestion extends BaseEntity {
	question: string;
	answers: TriviaAnswer[];
	correctAnswerIndex: number;
	difficulty: string;
	topic: string;
	category?: string;
	explanation?: string;
	source?: string;
	tags?: string[];
	rating?: number;
	timesAnswered?: number;
	successRate?: number;
	metadata?: Record<string, BasicValue>;
}

/**
 * Trivia answer interface
 * @interface TriviaAnswer
 * @description Trivia answer with metadata
 * @used_by client/src/components/game/TriviaForm.tsx, client/src/components/game/TriviaGame.tsx
 */
export interface TriviaAnswer {
	text: string;
	isCorrect: boolean;
	explanation?: string;
	order?: number;
	questionId?: string;
}

/**
 * Trivia request interface
 * @interface TriviaRequest
 * @description Request payload for trivia questions
 * @used_by client/src/services/api.service.ts, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaRequest {
	question_count: number;
	topic: string;
	difficulty: string;
	category?: string;
	language?: string;
	userId?: string;
	gameMode?: string;
	timeLimit?: number;
	questionLimit?: number;
}

/**
 * Trivia response interface
 * @interface TriviaResponse
 * @description Response payload for trivia questions
 * @used_by client/src/services/api.service.ts, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaResponse {
	questions: TriviaQuestion[];
	totalQuestions: number;
	metadata: {
		timestamp: string;
		requestId: string;
		processingTime: number;
		provider: string;
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
	questionId: string;
	userAnswer: string;
	correctAnswer: string;
	isCorrect: boolean;
	timeSpent: number;
	pointsEarned: number;
	totalScore: number;
	explanation?: string;
	feedback: string;
}

/**
 * Trivia session interface
 * @interface TriviaSession
 * @description Trivia game session
 * @used_by client/src/components/game/TriviaGame.tsx, client/src/hooks/layers/business/useGameMode.ts
 */
export interface TriviaSession {
	sessionId: string;
	userId: string;
	questions: TriviaQuestion[];
	currentQuestionIndex: number;
	answers: AnswerResult[];
	startTime: Date;
	endTime?: Date;
	status: 'active' | 'completed' | 'abandoned';
	score: number;
	timeLimit?: number;
	questionLimit?: number;
}

/**
 * Trivia category interface
 * @interface TriviaCategory
 * @description Trivia question category
 * @used_by client/src/components/gameMode/GameMode.tsx, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaCategory {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	questionCount: number;
	color?: string;
	order: number;
	isActive: boolean;
}

/**
 * Trivia difficulty interface
 * @interface TriviaDifficulty
 * @description Trivia difficulty level
 * @used_by client/src/components/gameMode/GameMode.tsx, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaDifficulty {
	id: string;
	name: string;
	description?: string;
	level: number;
	color?: string;
	questionCount: number;
	isActive: boolean;
}

/**
 * Trivia topic interface
 * @interface TriviaTopic
 * @description Trivia question topic
 * @used_by client/src/components/gameMode/GameMode.tsx, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaTopic {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	questionCount: number;
	color?: string;
	order: number;
	isActive: boolean;
	category?: string;
}

/**
 * Trivia statistics interface
 * @interface TriviaStatistics
 * @description Trivia statistics data
 * @used_by client/src/views/leaderboard/LeaderboardView.tsx, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaStatistics {
	totalQuestions: number;
	totalCorrectAnswers: number;
	successRate: number;
	averageTimePerQuestion: number;
	bestStreak: number;
	currentStreak: number;
	favoriteTopic: string;
	favoriteDifficulty: string;
	totalPlayTime: number;
	lastPlayed: Date;
}

/**
 * Trivia leaderboard entry interface
 * @interface TriviaLeaderboardEntry
 * @description Trivia leaderboard entry
 * @used_by client/src/views/leaderboard/LeaderboardView.tsx, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaLeaderboardEntry {
	userId: string;
	username: string;
	score: number;
	rank: number;
	gamesPlayed: number;
	successRate: number;
	bestStreak: number;
	totalPlayTime: number;
	lastPlayed: Date;
}
