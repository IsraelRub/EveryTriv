/**
 * Groq AI Provider Types
 *
 * @module GroqTypes
 * @description Type definitions for Groq AI models configuration
 * @used_by server/src/features/game/logic/providers/groq, shared/constants/domain/game.constants.ts
 */

/**
 * Groq model configuration interface
 * @interface GroqModelConfig
 * @description Configuration for a Groq AI model including priority, cost, and rate limits
 */
export interface GroqModelConfig {
	priority: number;
	cost: number;
	name: string;
	rateLimit?: {
		requestsPerMinute: number;
		requestsPerDay?: number;
		tokensPerMinute?: number;
	};
	availableInFreeTier?: boolean;
	maxTokens?: number;
}
