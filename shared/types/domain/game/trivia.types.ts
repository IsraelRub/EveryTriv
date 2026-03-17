// Trivia-related types for EveryTriv.
import { CUSTOM_DIFFICULTY_PREFIX, DifficultyLevel, type Locale } from '@shared/constants';

import type { BaseEntity } from '../../core/data.types';
import type { BaseValidationResult } from '../validation.types';

export type CustomDifficultyString = `${typeof CUSTOM_DIFFICULTY_PREFIX}${string}`;

export type GameDifficulty = DifficultyLevel | CustomDifficultyString;

export interface TriviaQuestionDetailsMetadata {
	category?: string;
	tags?: string[];
	providerName?: string;
	difficulty?: GameDifficulty;
	customDifficultyDescription?: string;
	generatedAt?: string;
	language?: string;
	explanation?: string;
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

export interface BaseTriviaConfig extends BaseGameTopicDifficulty {
	questionsPerRequest?: number;
}

export interface TriviaQuestionCore {
	question: string;
	answers: TriviaAnswer[];
}

export interface TriviaQuestionInput extends TriviaQuestionCore {
	correctAnswerIndex: number;
	topic: string;
	difficulty: GameDifficulty;
	metadata?: TriviaQuestionDetailsMetadata;
}

export interface TriviaQuestion extends TriviaQuestionInput, BaseEntity {}

export interface AdminTriviaFields {
	userId: string | null;
	isCorrect: boolean | null;
}

export type AdminTriviaQuestion = TriviaQuestion & AdminTriviaFields;

export interface TriviaQuestionsResponse {
	questions: AdminTriviaQuestion[];
	totalCount: number;
}

export interface BaseAnswerData {
	questionId: string;
	userAnswerIndex: number;
	isCorrect: boolean;
}

export interface TriviaRequest extends BaseTriviaConfig {
	questionsPerRequest: number;
	answerCount: number;
	outputLanguage: Locale;
	gameId?: string;
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

export interface SubmitAnswerResult extends BaseAnswerData {
	timeSpent: number;
	scoreEarned: number;
	totalScore: number;
	sessionScore: number;
	explanation?: string;
	feedback: string;
}
