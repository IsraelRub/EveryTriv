/**
 * Server-specific trivia types for EveryTriv
 * Extends shared types with server-specific functionality
 */
// Import core shared types from workspace root
import { DifficultyLevel } from '@shared';
import type {
	GameMode,
	TriviaAnswer,
	TriviaHistoryRequest,
	TriviaQuestion,
	TriviaRequest,
} from '@shared';

// Re-export shared types
export type { GameMode, TriviaAnswer, TriviaHistoryRequest, TriviaQuestion, TriviaRequest };

// Server-specific extensions

// Database data type
export interface TriviaData {
	id: string;
	topic: string;
	difficulty: string;
	question: string;
	answers: TriviaAnswer[];
	correct_answer_index: number;
	user_id: string | null;
	is_correct: boolean;
	created_at: Date;
}

// Server-specific request/response types
export interface CreateTriviaRequest extends TriviaRequest {
	userId?: string;
	customDifficulty?: string;
}

// Server-specific TriviaQuestion with mappedDifficulty
export interface ServerTriviaQuestion extends Omit<TriviaQuestion, 'metadata'> {
	metadata?: {
		actualDifficulty?: string;
		questionCount?: number;
		customDifficultyMultiplier?: number;
		mappedDifficulty?: DifficultyLevel;
	};
}

export interface TriviaResponse {
	question: ServerTriviaQuestion;
	metadata?: {
		actualDifficulty?: string;
		questionCount?: number;
		customDifficultyMultiplier?: number;
		mappedDifficulty?: DifficultyLevel;
	};
}
