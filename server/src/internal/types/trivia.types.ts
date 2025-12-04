import { DifficultyLevel } from '@shared/constants';
import type { BaseCacheEntry, GameDifficulty, TriviaQuestionInput } from '@shared/types';

/**
 * Trivia question metadata interface (server-side)
 * @interface TriviaQuestionMetadata
 * @description Provides additional context for generated questions used internally
 */
export interface TriviaQuestionMetadata {
	actualDifficulty: GameDifficulty;
	gameQuestionCount: number;
	customDifficultyMultiplier: number;
	mappedDifficulty: GameDifficulty;
}

/**
 * Server-side trivia question input type
 * @type ServerTriviaQuestionInput
 * @description Alias for TriviaQuestionInput with DifficultyLevel constraint
 */
export type ServerTriviaQuestionInput = TriviaQuestionInput<DifficultyLevel>;

/**
 * Cached question entry for provider-level caches (server-only)
 * @interface QuestionCacheEntry
 * @description Cache entry structure for trivia questions
 */
export interface QuestionCacheEntry extends BaseCacheEntry {
	question: ServerTriviaQuestionInput;
	accessCount: number;
}

/**
 * Question cache map type
 * @type QuestionCacheMap
 * @description Maps question keys to cache entries
 */
export type QuestionCacheMap = Record<string, QuestionCacheEntry>;
