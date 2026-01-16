export const VALIDATION_DEBOUNCE_DELAYS = {
	QUICK: 150,
	STANDARD: 300,
	LANGUAGE_CHECK: 500,
	ASYNC_VALIDATION: 1000,
} as const;

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
		MAX: 255,
	},
	TOPIC: {
		MIN: 2,
		MAX: 100,
	},
	CUSTOM_DIFFICULTY: {
		MIN: 3,
		MAX: 200,
	},
	FIRST_NAME: {
		MIN: 1,
		MAX: 50,
	},
	LAST_NAME: {
		MIN: 1,
		MAX: 50,
	},
	QUESTION: {
		MIN: 10,
		MAX: 500,
		PARSER_MAX: 150, // Maximum length for LLM parser validation (Groq)
	},
	ANSWER: {
		MAX: 200, // Maximum length for both trivia answers and game user answers
		PARSER_MAX: 100, // Maximum length for LLM parser validation (Groq)
	},
	REASON: {
		MAX: 200,
	},
	INPUT: {
		MIN: 1, // Minimum length for general input content validation
		MAX: 1000, // Maximum length for general input content validation
	},
	ROOM_CODE: {
		LENGTH: 8, // Room ID/code length (short alphanumeric identifier)
	},
	// String truncation limits (for logs and responses)
	STRING_TRUNCATION: {
		SHORT: 50, // Short string limit (for logs)
	},
	PAYMENT_INTENT_ID: {
		MIN: 1,
		MAX: 100,
	},
} as const;

export const VALIDATION_COUNT = {
	TIME_LIMIT: {
		MIN: 30,
		MAX: 300,
		STEP: 30,
	},
	PLAYERS: {
		MIN: 2,
		MAX: 4,
	},
	QUESTIONS: {
		MIN: 1,
		MAX: 10, // Maximum questions per request (matches server processing limit)
		STEP: 5,
		UNLIMITED: -1,
	},
	ANSWER_COUNT: {
		MIN: 3,
		MAX: 5,
		STEP: 1,
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
	AVATAR_ID: {
		MIN: 1,
		MAX: 16,
	},
	RETRY_ATTEMPTS: {
		QUESTION_GENERATION: 3, // Maximum retries for question generation
		ADMIN_BOOTSTRAP: 5, // Maximum retries for admin bootstrap
	},
	ROOM_GENERATION_ATTEMPTS: {
		MAX: 10, // Maximum attempts to generate unique room ID
	},
} as const;

export const LANGUAGE_VALIDATION_THRESHOLDS = {
	EXCESSIVE_PUNCTUATION: 0.3, // 30% of words
	EXCESSIVE_CAPITALIZATION: 0.2, // 20% of words
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
	ALLOWED_KEYS: new Set(['question', 'answers']),
} as const;

export const GRAMMAR_PATTERNS = [
	{ pattern: /\b(i)\s+/, suggestion: 'Use "I" instead of "i" at the beginning of sentences' },
	{ pattern: /\b(its)\s+(not|is|was|will)/, suggestion: 'Use "it\'s" (it is) instead of "its" (possessive)' },
	{ pattern: /\b(your)\s+(welcome)/, suggestion: 'Use "you\'re" (you are) instead of "your" (possessive)' },
	{ pattern: /\b(there)\s+(going)/, suggestion: 'Use "they\'re" (they are) instead of "there" (location)' },
	{ pattern: /\b(their)\s+(going)/, suggestion: 'Use "they\'re" (they are) instead of "their" (possessive)' },
] as const;

export const VALIDATORS = {
	string: (value: unknown): value is string => typeof value === 'string',
	number: (value: unknown): value is number =>
		typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value),
	boolean: (value: unknown): value is boolean => typeof value === 'boolean',
	function: (value: unknown): value is Function => typeof value === 'function',
	date: (value: unknown): value is Date | string =>
		(value instanceof Date && !Number.isNaN(value.getTime())) ||
		(typeof value === 'string' && !Number.isNaN(Date.parse(value))),
} as const;
