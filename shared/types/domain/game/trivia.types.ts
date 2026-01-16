// Trivia-related types for EveryTriv.
import {
	CUSTOM_DIFFICULTY_PREFIX,
	DifficultyLevel,
	GameMode,
	GameStatus,
	TriviaQuestionSource,
} from '@shared/constants';

import type { BaseEntity } from '../../core/data.types';
import type { BaseValidationResult } from '../validation.types';

export type CustomDifficultyString = `${typeof CUSTOM_DIFFICULTY_PREFIX}${string}`;

export type GameDifficulty = DifficultyLevel | CustomDifficultyString;

export interface BaseTriviaParams {
	topic?: string;
	difficulty?: GameDifficulty;
	count?: number;
	answerCount?: number;
}

export interface TriviaQuestionDetailsMetadata {
	category?: string;
	tags?: string[];
	source?: TriviaQuestionSource;
	providerName?: string;
	difficulty?: GameDifficulty;
	difficultyScore?: number;
	customDifficultyDescription?: string;
	generatedAt?: string;
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
	mappedDifficulty?: DifficultyLevel;
}

export interface TriviaAnswer {
	text: string;
	isCorrect: boolean;
	explanation?: string;
	order?: number;
	questionId?: string;
}

export interface BaseGameTopicDifficulty {
	topic: string;
	difficulty: GameDifficulty;
}

export interface BaseTriviaConfig {
	topic: string;
	difficulty: GameDifficulty;
	questionsPerRequest?: number;
	gameMode?: GameMode;
}

export type TriviaQuestionInput = Omit<TriviaQuestion, 'id' | 'createdAt' | 'updatedAt'>;

export interface TriviaQuestion extends BaseEntity {
	question: string;
	answers: TriviaAnswer[];
	correctAnswerIndex: number;
	topic: string;
	difficulty: GameDifficulty;
	metadata?: TriviaQuestionDetailsMetadata;
	rating?: number;
	timesAnswered?: number;
	successRate?: number;
}

export interface BaseAnswerPayload {
	questionId: string;
	timeSpent: number;
}

export interface BaseAnswerData {
	questionId: string;
	userAnswerIndex: number;
	isCorrect: boolean;
}

export interface TriviaRequest extends BaseTriviaConfig {
	questionsPerRequest: number;
	category?: string;
	userId?: string;
	timeLimit?: number;
	maxQuestionsPerGame?: number;
	answerCount?: number;
}

export interface GameAnswerSubmission extends BaseAnswerPayload {
	answer: number;
}

export interface TriviaInputValidationResult {
	topic: BaseValidationResult;
	difficulty: BaseValidationResult;
	overall: {
		isValid: boolean;
		canProceed: boolean;
	};
}

export interface TriviaResponse {
	questions: TriviaQuestion[];
	fromCache: boolean;
}

export interface AnswerResult extends BaseAnswerData {
	timeSpent: number;
	scoreEarned: number;
	totalScore: number;
	explanation?: string;
	feedback: string;
}

export interface TriviaSession {
	sessionId: string;
	userId: string;
	questions: TriviaQuestion[];
	currentQuestionIndex: number;
	answers: AnswerResult[];
	startTime: Date;
	endTime?: Date;
	status: GameStatus;
	score: number;
	timeLimit?: number;
	maxQuestionsPerGame?: number;
}
