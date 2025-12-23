/**
 * Language Types (server-only)
 * @module ServerLanguageTypes
 * @description Server-specific language tool type definitions
 */

import type { LanguageToolError, LanguageToolResponse } from '@shared/types';

/**
 * Re-export shared language tool types for server use
 */
export type { LanguageToolError, LanguageToolResponse };

/**
 * Language tool check options interface
 * @interface LanguageToolCheckOptions
 * @description Extended options for language tool text checking (server-only)
 */
export interface LanguageToolCheckOptions {
	enableSpellCheck?: boolean;
	enableGrammarCheck?: boolean;
	useExternalAPI?: boolean;
	language?: string;
}
