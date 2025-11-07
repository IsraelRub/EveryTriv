import { DifficultyLevel } from '@shared/constants';
import type { GameDifficulty, TriviaQuestionInput } from '@shared/types';

/**
 * Trivia question metadata interface (server-side)
 * Provides additional context for generated questions used internally
 */
export interface TriviaQuestionMetadata {
	actualDifficulty: GameDifficulty;
	questionCount: number;
	customDifficultyMultiplier: number;
	mappedDifficulty: GameDifficulty;
}

export type ServerTriviaQuestionInput = TriviaQuestionInput<DifficultyLevel>;

/**
 * Cached question entry for provider-level caches (server-only)
 */
export interface QuestionCacheEntry {
	question: ServerTriviaQuestionInput;
	createdAt: Date;
	accessCount: number;
	lastAccessed: Date;
}

export type QuestionCacheMap = Record<string, QuestionCacheEntry>;
