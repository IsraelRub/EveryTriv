import type { ProviderPriorityMap } from '../types';

/**
 * AI Provider Constants
 *
 * @module AIConstants
 * @description Server-specific constants for AI providers configuration
 * @used_by server/src/features/game/logic/providers
 */

/**
 * Provider names enum
 */
export const AI_PROVIDER_NAMES = {
	GROQ: 'Groq',
	GEMINI: 'Gemini',
	CHATGPT: 'ChatGPT',
	CLAUDE: 'Claude',
} as const;

/**
 * Provider priority mapping
 * Lower number = higher priority (selected first)
 */
export const AI_PROVIDER_PRIORITIES: ProviderPriorityMap = {
	[AI_PROVIDER_NAMES.GROQ]: 1,
	[AI_PROVIDER_NAMES.GEMINI]: 2,
	[AI_PROVIDER_NAMES.CHATGPT]: 3,
	[AI_PROVIDER_NAMES.CLAUDE]: 4,
} as const;

/**
 * Mapping from provider names to their error message keys
 * Used to get the correct error message for each provider
 */
export const PROVIDER_ERROR_MESSAGE_KEYS = {
	[AI_PROVIDER_NAMES.GROQ]: 'INVALID_GROQ_RESPONSE',
	[AI_PROVIDER_NAMES.GEMINI]: 'INVALID_GEMINI_RESPONSE',
	[AI_PROVIDER_NAMES.CHATGPT]: 'INVALID_CHATGPT_RESPONSE',
	[AI_PROVIDER_NAMES.CLAUDE]: 'INVALID_CLAUDE_RESPONSE',
} as const;
