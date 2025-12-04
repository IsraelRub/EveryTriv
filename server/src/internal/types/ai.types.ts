/**
 * AI Provider Types
 * @module AIProviderTypes
 * @description Type definitions for AI provider configuration
 */
import type { AI_PROVIDER_NAMES } from '../constants/ai.constants';

/**
 * Provider priority mapping
 * @interface ProviderPriorityMap
 * @description Mapping of provider names to their priority values (lower number = higher priority)
 */
export interface ProviderPriorityMap {
	readonly [AI_PROVIDER_NAMES.GROQ]: 1;
	readonly [AI_PROVIDER_NAMES.GEMINI]: 2;
	readonly [AI_PROVIDER_NAMES.CHATGPT]: 3;
	readonly [AI_PROVIDER_NAMES.CLAUDE]: 4;
}
