/**
 * Language Types (server-only)
 * @module ServerLanguageTypes
 * @description Server-specific language tool type definitions
 */


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
