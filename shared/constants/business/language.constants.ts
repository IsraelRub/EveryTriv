/**
 * Language validation constants
 *
 * @module language.constants
 * @description Constants for language validation and LanguageTool API
 */

export const LANGUAGE_TOOL_CONSTANTS = {
	BASE_URL: 'https://api.languagetool.org/v2',
	ENDPOINTS: {
		CHECK: '/check',
		LANGUAGES: '/languages',
	},
	RULES: {
		SPELLING: 'SPELLING',
		GRAMMAR: 'GRAMMAR',
		STYLE: 'STYLE',
		TYPOS: 'TYPOS',
	},
	LANGUAGES: {
		AUTO: 'auto',
		ENGLISH: 'en',
		HEBREW: 'he',
		SPANISH: 'es',
		FRENCH: 'fr',
		GERMAN: 'de',
	},
	CONFIDENCE: {
		HIGH: 0.95,
		MEDIUM: 0.8,
		LOW: 0.5,
	},
	TIMEOUT: 10000, // 10 seconds
	MAX_RETRIES: 3,
} as const;

export const COMMON_MISSPELLINGS = {
	en: {
		recieve: ['receive'],
		seperate: ['separate'],
		occured: ['occurred'],
		begining: ['beginning'],
		beleive: ['believe'],
		definately: ['definitely'],
		enviroment: ['environment'],
		goverment: ['government'],
		neccessary: ['necessary'],
		occassion: ['occasion'],
		priviledge: ['privilege'],
		probaly: ['probably'],
		rember: ['remember'],
		sucess: ['success'],
		untill: ['until'],
		wierd: ['weird'],
	},
	he: {
		שלום: ['שלום'],
		תודה: ['תודה'],
		אנחנו: ['אנחנו'],
	},
} as const;

export const GRAMMAR_PATTERNS = [
	{ pattern: /\b(i)\s+/, suggestion: 'Use "I" instead of "i" at the beginning of sentences' },
	{ pattern: /\b(its)\s+(not|is|was|will)/, suggestion: 'Use "it\'s" (it is) instead of "its" (possessive)' },
	{ pattern: /\b(your)\s+(welcome)/, suggestion: 'Use "you\'re" (you are) instead of "your" (possessive)' },
	{ pattern: /\b(there)\s+(going)/, suggestion: 'Use "they\'re" (they are) instead of "there" (location)' },
	{ pattern: /\b(their)\s+(going)/, suggestion: 'Use "they\'re" (they are) instead of "their" (possessive)' },
] as const;

export const LANGUAGE_DETECTION = {
	HEBREW_CHARS: /[\u0590-\u05FF]/,
	ENGLISH_CHARS: /[a-zA-Z]/,
} as const;
