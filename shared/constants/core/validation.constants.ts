import { TIME_DURATIONS_SECONDS, TIME_PERIODS_MS } from './time.constants';

export enum ClientValidationType {
	EMAIL = 'email',
	PASSWORD = 'password',
	TOPIC = 'topic',
	CUSTOM_DIFFICULTY = 'customDifficulty',
	FIRST_NAME = 'firstName',
	LAST_NAME = 'lastName',
}

export const VALIDATION_LENGTH = {
	PASSWORD: {
		MIN: 6,
		MAX: 15,
	},
	EMAIL: {
		MIN: 3,
		MAX: 255,
	},
	TOPIC: {
		MIN: 2,
		MAX: 75,
	},
	CUSTOM_DIFFICULTY: {
		MIN: 3,
		MAX: 150,
	},
	NAME: {
		MIN: 1,
		MAX: 50,
	},
	FIRST_NAME: {
		MIN: 1,
		MAX: 50,
	},
	LAST_NAME: {
		MIN: 1,
		MAX: 50,
	},
	CARDHOLDER_NAME: {
		MIN: 2,
		MAX: 80,
	},
	CARD_NUMBER: {
		MIN: 12,
		MAX: 19,
	},
	CVV: {
		MIN: 3,
		MAX: 4,
	},
	ORDER_ID: {
		MIN: 10,
		MAX: 100,
	},
	POSTAL_CODE: {
		MAX: 20,
	},
	CURRENCY_CODE: {
		MAX: 10,
	},
	ADDITIONAL_INFO: {
		MAX: 500,
	},
	QUESTION: {
		MIN: 10,
		MAX: 300,
		PARSER_MAX: 150,
	},
	ANSWER: {
		MAX: 150,
		PARSER_MAX: 100,
	},
	REASON: {
		MAX: 150,
	},
	INPUT: {
		MIN: 1,
		MAX: 500,
	},
	ROOM_CODE: {
		LENGTH: 8,
	},
	STRING_TRUNCATION: {
		SHORT: 50,
		TOKEN_PREVIEW: 23,
		ERROR_PREVIEW: 13,
		ID_PREVIEW: 11,
		CONTENT_PREVIEW: 103,
	},
	SEARCH_QUERY: {
		MIN: 1,
		MAX: 80,
	},
	IDENTIFIER: {
		MAX: 100,
	},
} as const;

/** Debounce before calling text language / spelling validation from the game settings form. */
export const LANGUAGE_VALIDATION_DEBOUNCE_MS = 500;

export enum LengthKey {
	TOPIC = 'TOPIC',
	CUSTOM_DIFFICULTY = 'CUSTOM_DIFFICULTY',
	FIRST_NAME = 'FIRST_NAME',
	LAST_NAME = 'LAST_NAME',
	CARDHOLDER_NAME = 'CARDHOLDER_NAME',
	CARD_NUMBER = 'CARD_NUMBER',
	CVV = 'CVV',
	PASSWORD = 'PASSWORD',
	EMAIL = 'EMAIL',
}

export const LENGTH_RULES: Record<LengthKey, { fieldName: string; required: boolean }> = {
	[LengthKey.TOPIC]: { fieldName: 'Topic', required: true },
	[LengthKey.CUSTOM_DIFFICULTY]: { fieldName: 'Description', required: true },
	[LengthKey.FIRST_NAME]: { fieldName: 'First name', required: true },
	[LengthKey.LAST_NAME]: { fieldName: 'Last name', required: false },
	[LengthKey.CARDHOLDER_NAME]: { fieldName: 'Cardholder name', required: true },
	[LengthKey.CARD_NUMBER]: { fieldName: 'Card number', required: true },
	[LengthKey.CVV]: { fieldName: 'CVV', required: true },
	[LengthKey.PASSWORD]: { fieldName: 'Password', required: false },
	[LengthKey.EMAIL]: { fieldName: 'Email', required: false },
};

export const FORBIDDEN_CONTENT_WORDS = ['spam', 'test', 'xxx'] as const;

export const VALIDATION_COUNT = {
	TIME_LIMIT: {
		MIN: TIME_DURATIONS_SECONDS.THIRTY_SECONDS,
		MAX: TIME_DURATIONS_SECONDS.FIVE_MINUTES,
		STEP: TIME_DURATIONS_SECONDS.THIRTY_SECONDS,
		DEFAULT: TIME_DURATIONS_SECONDS.MINUTE,
	},
	PLAYERS: {
		MIN: 2,
		MAX: 6,
		DEFAULT: 4,
	},
	QUESTIONS: {
		MIN: 1,
		MAX: 50, // Maximum questions per request (matches server processing limit)
		STEP: 5,
		UNLIMITED: -1,

		INITIAL_BATCH_UNLIMITED: 15,
		INITIAL_BATCH_TIME_LIMITED: 8,
	},
	ANSWER_COUNT: {
		MIN: 3,
		MAX: 5,
		DEFAULT: 4,
	},
	CREDITS: {
		MIN: 1,
		MAX: 10000,
	},
	LEADERBOARD: {
		MIN: 1,
		MAX: 100,
		DEFAULT: 50,
	},
	ACTIVITY_ENTRIES: {
		MIN: 1,
		MAX: 200,
		DEFAULT: 30,
	},
	AVATAR_ID: {
		MIN: 1,
		MAX: 15,
	},
	LIST_QUERY: {
		LIMIT_MIN: 1,
		LIMIT_MAX: 1000,
		OFFSET_MIN: 0,
		/** Default page size for client admin tables and other paginated UI lists */
		DEFAULT_PAGE_SIZE: 10,
	},
	MULTIPLAYER_PUBLIC_LOBBY_LIST: {
		/** Default page size for `GET /multiplayer/rooms/public-waiting` */
		LIMIT: 30,
		LIMIT_MIN: 1,
		LIMIT_MAX: 50,
	},
	/** Admin `GET /user/admin/all` pagination (aligned with `UserCoreService.getAllUsers` clamp) */
	ADMIN_USERS_LIST: {
		LIMIT_MIN: 1,
		LIMIT_MAX: 200,
		DEFAULT_LIMIT: 50,
		DEFAULT_OFFSET: 0,
	},
	/** Admin `GET /admin/trivia` pagination (aligned with `AdminService.getAllTriviaQuestions` clamp) */
	ADMIN_TRIVIA_LIST: {
		LIMIT_MIN: 1,
		LIMIT_MAX: 1000,
		DEFAULT_LIMIT: 500,
		DEFAULT_OFFSET: 0,
	},
} as const;

export const LANGUAGE_VALIDATION_THRESHOLDS = {
	EXCESSIVE_PUNCTUATION: 0.3, // 30% of words
	EXCESSIVE_CAPITALIZATION: 0.2, // 20% of words
	/** Minimum non-space/non-punct length before gibberish heuristics apply */
	GIBBERISH_MIN_CLEANED_LENGTH: 4,
	/** Flag when (unique characters / cleaned length) is at or below this (e.g. "ababab" → 2/6 ≈ 0.33) */
	GIBBERISH_MAX_UNIQUE_TO_LENGTH_RATIO: 0.35,
	/** Same character repeated this many times in a row (e.g. 3 → "aaa") */
	GIBBERISH_MAX_SAME_CHAR_STREAK: 3,
	GIBBERISH_MAX_CONSONANT_STREAK_EN: 5,
	GIBBERISH_LATIN_MIN_LETTERS_FOR_CONSONANT_CHECK: 4,
	GIBBERISH_HEBREW_MIN_LETTERS_FOR_MATRES_CHECK: 5,
	GIBBERISH_HEBREW_MAX_STREAK_WITHOUT_MATRES: 6,
	/** Word-level: minimum number of whitespace-separated tokens for the "all single-letter" check */
	GIBBERISH_MIN_SINGLE_CHAR_WORD_COUNT: 3,
} as const;

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
		ENGLISH: 'en',
		HEBREW: 'he',
	},
	CONFIDENCE: {
		HIGH: 0.95,
		MEDIUM: 0.8,
		LOW: 0.5,
	},
	TIMEOUT: TIME_PERIODS_MS.TEN_SECONDS,
	AVAILABILITY_CACHE_TTL_MS: {
		SUCCESS: TIME_PERIODS_MS.FIVE_MINUTES,
		FAILURE: TIME_PERIODS_MS.THIRTY_SECONDS,
	},

	MIN_TEXT_LENGTH_FOR_API: 1,
} as const;

export const COMMON_MISSPELLINGS = {
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
} as const;

export const LLM_PARSER = {
	SMART_DOUBLE_QUOTES_REGEX: /[""„‟«»＂]/g,
	ALLOWED_KEYS: new Set(['question', 'answers', 'generationDeclinedReason']),
} as const;

export const GRAMMAR_PATTERNS = [
	{ pattern: /\b(i)\s+/, suggestion: 'Use "I" instead of "i" at the beginning of sentences' },
	{ pattern: /\b(its)\s+(not|is|was|will)/, suggestion: 'Use "it\'s" (it is) instead of "its" (possessive)' },
	{ pattern: /\b(your)\s+(welcome)/, suggestion: 'Use "you\'re" (you are) instead of "your" (possessive)' },
	{ pattern: /\b(there)\s+(going)/, suggestion: 'Use "they\'re" (they are) instead of "there" (location)' },
	{ pattern: /\b(their)\s+(going)/, suggestion: 'Use "they\'re" (they are) instead of "their" (possessive)' },
] as const;
