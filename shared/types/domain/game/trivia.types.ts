/**
 * Trivia-related types for EveryTriv
 *
 * @module TriviaTypes
 * @description Type definitions for trivia questions, answers, and trivia-related entities
 * @used_by client/src/components/game/TriviaForm.tsx, client/src/components/game/TriviaGame.tsx
 */
import { CUSTOM_DIFFICULTY_PREFIX, DifficultyLevel, GameMode } from '@shared/constants';

import type { BaseEntity } from '../../core/data.types';
import type { BaseValidationResult } from '../validation.types';

/**
 * Custom difficulty string type
 * @type CustomDifficultyString
 * @description String that represents a custom difficulty with the custom: prefix
 */
export type CustomDifficultyString = `${typeof CUSTOM_DIFFICULTY_PREFIX}${string}`;

/**
 * Game difficulty type union
 * @type GameDifficulty
 * @description Union type for both standard difficulty levels and custom difficulties
 * @used_by server/src/features/game/logic, client/src/components/game, shared/validation
 */
export type GameDifficulty = DifficultyLevel | CustomDifficultyString;

/**
 * Acceptable sources for trivia questions
 * @type TriviaQuestionSource
 * @description Sources that trivia questions can come from
 */
export type TriviaQuestionSource = 'ai' | 'user' | 'imported' | 'seeded' | 'system';

/**
 * Review state for curated trivia questions
 * @type TriviaQuestionReviewStatus
 * @description Review status for trivia questions
 */
export type TriviaQuestionReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

/**
 * Structured metadata describing trivia question provenance and quality signals
 * @interface TriviaQuestionDetailsMetadata
 * @description Metadata for trivia questions
 */
export interface TriviaQuestionDetailsMetadata {
	category?: string;
	tags?: string[];
	source?: TriviaQuestionSource;
	providerName?: string;
	difficulty?: GameDifficulty;
	difficultyScore?: number;
	customDifficultyDescription?: string;
	generatedAt?: string;
	importedAt?: string;
	lastReviewedAt?: string;
	reviewStatus?: TriviaQuestionReviewStatus;
	language?: string;
	explanation?: string;
	referenceUrls?: string[];
	hints?: string[];
	usageCount?: number;
	correctAnswerCount?: number;
	aiConfidenceScore?: number;
	safeContentScore?: number;
	flaggedReasons?: string[];
	popularityScore?: number;
	averageAnswerTimeMs?: number;
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
 * Trivia question interface
 * @interface TriviaQuestion
 * @description Trivia question with answers and metadata
 * @used_by client/src/components/game/TriviaForm.tsx, client/src/components/game/TriviaGame.tsx
 */
/**
 * Base interface for topic and difficulty
 * @interface BaseGameTopicDifficulty
 * @description Common structure for interfaces that contain topic and difficulty
 */
export interface BaseGameTopicDifficulty {
	topic: string;
	difficulty: GameDifficulty;
}

/**
 * Base interface for trivia configuration
 * @interface BaseTriviaConfig
 * @description Common structure for trivia request configurations
 */
export interface BaseTriviaConfig {
	topic: string;
	difficulty: GameDifficulty;
	questionsPerRequest?: number;
	gameMode?: GameMode;
}

/**
 * Core trivia question structure used across input and payload types
 */
export interface TriviaQuestionCore<TDifficulty = GameDifficulty> {
	question: string;
	answers: string[];
	correctAnswerIndex: number;
	topic: string;
	difficulty: TDifficulty;
	metadata?: TriviaQuestionDetailsMetadata;
}

/**
 * Trivia question interface
 * @interface TriviaQuestion
 * @description Trivia question with answers and metadata
 * @used_by client/src/components/game/TriviaForm.tsx, client/src/components/game/TriviaGame.tsx
 */
export interface TriviaQuestion extends BaseEntity, Omit<TriviaQuestionCore, 'answers'> {
	answers: TriviaAnswer[];
	category?: string;
	explanation?: string;
	source?: string;
	tags?: string[];
	rating?: number;
	timesAnswered?: number;
	successRate?: number;
}

/**
 * Trivia question payload interface for validation and submission flows
 * @description Allows partial metadata while enforcing essential fields
 */
export type TriviaQuestionInput<TDifficulty = GameDifficulty> = TriviaQuestionCore<TDifficulty>;

export type TriviaQuestionPayload = Pick<TriviaQuestionInput, 'question' | 'answers' | 'correctAnswerIndex'> &
	Partial<Omit<TriviaQuestionInput, 'question' | 'answers' | 'correctAnswerIndex'>>;

/**
 * Base answer payload shared across submission and result structures
 */
export interface BaseAnswerPayload {
	questionId: string;
	timeSpent: number;
}

/**
 * Trivia request interface
 * @interface TriviaRequest
 * @description Request payload for trivia questions
 * @used_by client/src/services/api.service.ts, client/src/hooks/api/useTrivia.ts
 */
export interface TriviaRequest extends BaseTriviaConfig {
	questionsPerRequest: number;
	category?: string;
	userId?: string;
	timeLimit?: number;
	maxQuestionsPerGame?: number;
	answerCount?: number;
}

/**
 * Game answer submission data
 * @interface GameAnswerSubmission
 * @description Payload for submitting an answer during gameplay
 */
export interface GameAnswerSubmission extends BaseAnswerPayload {
	answer: string;
}

/**
 * Trivia input validation result
 * @interface TriviaInputValidationResult
 * @description Aggregated validation results for trivia topic and difficulty inputs
 */
export interface TriviaInputValidationResult {
	topic: BaseValidationResult;
	difficulty: BaseValidationResult;
	overall: {
		isValid: boolean;
		canProceed: boolean;
	};
}

/**
 * Trivia response interface
 * @interface TriviaResponse
 * @description Response payload for trivia questions from the server
 * @used_by client/src/services/api.service.ts, client/src/hooks/api/useTrivia.ts, server/src/features/game/game.service.ts
 */
export interface TriviaResponse {
	questions: TriviaQuestion[];
	fromCache: boolean;
}

/**
 * Answer result interface
 * @interface AnswerResult
 * @description Result of answering a trivia question
 * @used_by client/src/components/game/TriviaForm.tsx, client/src/components/game/TriviaGame.tsx, server/src/features/game/game.service.ts
 */
export interface AnswerResult extends BaseAnswerPayload {
	userAnswer: string;
	correctAnswer: string;
	isCorrect: boolean;
	scoreEarned: number;
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
	maxQuestionsPerGame?: number;
}
