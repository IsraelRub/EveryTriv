/**
 * Metadata types for EveryTriv
 * Shared between client and server
 *
 * @module MetadataTypes
 * @description Metadata structures for various entities
 */
import type { BaseData } from './data.types';

/**
 * Base metadata interface
 * @interface BaseMetadata
 * @description Base interface for metadata structures
 * @extends BaseData
 */
export interface BaseMetadata extends BaseData {
	/** Creation timestamp */
	createdAt?: string;
	/** Last update timestamp */
	updatedAt?: string;
	/** Source of the data */
	source?: string;
	/** Version information */
	version?: string;
}

/**
 * Question metadata interface
 * @interface QuestionMetadata
 * @description Metadata specific to trivia questions
 * @extends BaseMetadata
 */
export interface QuestionMetadata extends BaseMetadata {
	/** Question category/topic */
	category?: string;
	/** Difficulty level */
	difficulty?: string;
	/** Question quality score */
	qualityScore?: number;
	/** Number of times used */
	usageCount?: number;
	/** Average response time */
	averageResponseTime?: number;
	/** Success rate percentage */
	successRate?: number;
}

/**
 * Game metadata interface
 * @interface GameMetadata
 * @description Metadata specific to game operations
 * @extends BaseMetadata
 */
export interface GameMetadata extends BaseMetadata {
	/** Game ID */
	gameId?: string;
	/** User ID */
	userId?: string;
	/** Topic name */
	topic?: string;
	/** Difficulty level */
	difficulty?: string;
	/** Game score */
	score?: number;
	/** Number of correct answers */
	correctAnswers?: number;
	/** Total questions in session */
	totalQuestions?: number;
	/** Time spent in seconds */
	timeSpent?: number;
	/** Game session ID */
	sessionId?: string;
	/** Actual difficulty level */
	actualDifficulty?: string;
	/** Question count */
	questionCount?: number;
	/** Custom difficulty multiplier */
	customDifficultyMultiplier?: number;
	/** Mapped difficulty level */
	mappedDifficulty?: string;
	/** Whether this is a fallback question */
	isFallback?: boolean;
	/** Error type for fallback questions */
	errorType?: 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'API_ERROR' | 'UNKNOWN_ERROR';
	/** Error message for fallback questions */
	errorMessage?: string;
	/** Fallback reason in Hebrew */
	fallbackReason?: string;
}
