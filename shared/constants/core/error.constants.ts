export enum ErrorCode {
	// General / HTTP
	AI_PROVIDERS_FAILED = 'AI_PROVIDERS_FAILED',
	NETWORK_ERROR = 'NETWORK_ERROR',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	NOT_FOUND = 'NOT_FOUND',
	UNAUTHORIZED = 'UNAUTHORIZED',
	FORBIDDEN = 'FORBIDDEN',
	INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',

	// Payment
	PAYMENT_PROCESSING_FAILED = 'PAYMENT_PROCESSING_FAILED',
	FAILED_TO_PURCHASE_CREDITS = 'FAILED_TO_PURCHASE_CREDITS',
	INVALID_PACKAGE_ID = 'INVALID_PACKAGE_ID',
	INVALID_CREDITS_PACKAGE = 'INVALID_CREDITS_PACKAGE',
	INVALID_CREDITS_AMOUNT = 'INVALID_CREDITS_AMOUNT',
	INVALID_PAYMENT_INTENT_ID = 'INVALID_PAYMENT_INTENT_ID',
	PAYMENT_NOT_COMPLETED = 'PAYMENT_NOT_COMPLETED',
	FAILED_TO_INITIALIZE_PAYPAL = 'FAILED_TO_INITIALIZE_PAYPAL',
	CARD_DETAILS_REQUIRED = 'CARD_DETAILS_REQUIRED',
	INCOMPLETE_PAYMENT_INFO = 'INCOMPLETE_PAYMENT_INFO',
	PAYPAL_ORDER_ID_REQUIRED = 'PAYPAL_ORDER_ID_REQUIRED',

	// Authentication
	USER_NOT_AUTHENTICATED = 'USER_NOT_AUTHENTICATED',
	INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
	AUTHENTICATION_RESULT_INCOMPLETE = 'AUTHENTICATION_RESULT_INCOMPLETE',
	AUTHENTICATION_TOKEN_REQUIRED = 'AUTHENTICATION_TOKEN_REQUIRED',
	INVALID_AUTHENTICATION_TOKEN = 'INVALID_AUTHENTICATION_TOKEN',
	AUTHENTICATION_FAILED_GENERIC = 'AUTHENTICATION_FAILED_GENERIC',
	INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
	ACCOUNT_IS_INACTIVE = 'ACCOUNT_IS_INACTIVE',
	TOKEN_GENERATION_FAILED = 'TOKEN_GENERATION_FAILED',
	TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',

	// Email verification
	VERIFICATION_TOKEN_INVALID_OR_EXPIRED = 'VERIFICATION_TOKEN_INVALID_OR_EXPIRED',
	EMAIL_ALREADY_VERIFIED = 'EMAIL_ALREADY_VERIFIED',
	EMAIL_VERIFICATION_REQUIRED = 'EMAIL_VERIFICATION_REQUIRED',

	// Google / OAuth profile
	GOOGLE_PROFILE_MISSING_IDENTIFIER = 'GOOGLE_PROFILE_MISSING_IDENTIFIER',
	GOOGLE_PROFILE_INVALID_FORMAT = 'GOOGLE_PROFILE_INVALID_FORMAT',
	GOOGLE_PROFILE_INVALID_FORMAT_BUFFER = 'GOOGLE_PROFILE_INVALID_FORMAT_BUFFER',
	GOOGLE_PROFILE_INVALID_FORMAT_STRING = 'GOOGLE_PROFILE_INVALID_FORMAT_STRING',
	PARSED_BUFFER_NOT_VALID_PROFILE = 'PARSED_BUFFER_NOT_VALID_PROFILE',
	PARSED_STRING_NOT_VALID_PROFILE = 'PARSED_STRING_NOT_VALID_PROFILE',
	PROFILE_ID_MISSING = 'PROFILE_ID_MISSING',
	PROFILE_RESPONSE_MISSING = 'PROFILE_RESPONSE_MISSING',
	PROFILE_DATA_MISSING = 'PROFILE_DATA_MISSING',
	GOOGLE_PROFILE_ID_MISSING = 'GOOGLE_PROFILE_ID_MISSING',

	// User
	EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
	USER_NOT_FOUND_OR_AUTH_FAILED = 'USER_NOT_FOUND_OR_AUTH_FAILED',
	USER_ACCOUNT_DISABLED = 'USER_ACCOUNT_DISABLED',
	USER_DATA_VALIDATION_FAILED = 'USER_DATA_VALIDATION_FAILED',
	AVATAR_ID_OUT_OF_RANGE = 'AVATAR_ID_OUT_OF_RANGE',
	SEARCH_QUERY_TOO_SHORT = 'SEARCH_QUERY_TOO_SHORT',
	REQUIRED_FIELD_AND_VALUE = 'REQUIRED_FIELD_AND_VALUE',
	REQUIRED_PREFERENCE_AND_VALUE = 'REQUIRED_PREFERENCE_AND_VALUE',
	REQUIRED_USER_ID = 'REQUIRED_USER_ID',
	REQUIRED_AMOUNT_AND_REASON = 'REQUIRED_AMOUNT_AND_REASON',
	REQUIRED_USER_ID_AND_STATUS = 'REQUIRED_USER_ID_AND_STATUS',
	INVALID_STATUS = 'INVALID_STATUS',
	INVALID_FIELD = 'INVALID_FIELD',

	// Password
	PASSWORD_NOT_SET = 'PASSWORD_NOT_SET',
	CURRENT_PASSWORD_INCORRECT = 'CURRENT_PASSWORD_INCORRECT',
	CURRENT_PASSWORD_AND_NEW_PASSWORD_REQUIRED = 'CURRENT_PASSWORD_AND_NEW_PASSWORD_REQUIRED',
	PASSWORD_HASH_FAILED = 'PASSWORD_HASH_FAILED',

	// Credits
	INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
	INVALID_USER_ID = 'INVALID_USER_ID',
	VALID_QUESTIONS_PER_REQUEST_REQUIRED = 'VALID_QUESTIONS_PER_REQUEST_REQUIRED',
	QUESTIONS_PER_REQUEST_REQUIRED = 'QUESTIONS_PER_REQUEST_REQUIRED',
	PACKAGE_ID_REQUIRED = 'PACKAGE_ID_REQUIRED',
	LIMIT_OUT_OF_RANGE = 'LIMIT_OUT_OF_RANGE',
	LIMIT_CANNOT_EXCEED_100 = 'LIMIT_CANNOT_EXCEED_100',
	LIMIT_CANNOT_EXCEED_1000 = 'LIMIT_CANNOT_EXCEED_1000',

	// Game (single-player, session, trivia)
	INVALID_GAME_MODE = 'INVALID_GAME_MODE',
	INVALID_QUESTION_ID_FORMAT = 'INVALID_QUESTION_ID_FORMAT',
	INVALID_GAME_ID_FORMAT = 'INVALID_GAME_ID_FORMAT',
	FAILED_TO_SAVE_CONFIG = 'FAILED_TO_SAVE_CONFIG',
	INVALID_QUESTION_FORMAT = 'INVALID_QUESTION_FORMAT',
	INVALID_QUESTION_FORMAT_FROM_AI = 'INVALID_QUESTION_FORMAT_FROM_AI',
	NO_CORRECT_ANSWER_FOUND = 'NO_CORRECT_ANSWER_FOUND',
	AI_RETURNED_EMPTY_RESPONSE = 'AI_RETURNED_EMPTY_RESPONSE',
	QUESTION_ID_REQUIRED = 'QUESTION_ID_REQUIRED',
	QUESTION_ID_AND_ANSWER_REQUIRED = 'QUESTION_ID_AND_ANSWER_REQUIRED',
	SCORE_REQUIRED = 'SCORE_REQUIRED',
	GAME_ID_REQUIRED = 'GAME_ID_REQUIRED',
	QUESTION_GENERATION_TIMEOUT = 'QUESTION_GENERATION_TIMEOUT',
	RESPONSE_CONTENT_EMPTY = 'RESPONSE_CONTENT_EMPTY',
	FAILED_TO_INITIALIZE_GAME_SESSION = 'FAILED_TO_INITIALIZE_GAME_SESSION',
	INVALID_ANSWER_INDEX = 'INVALID_ANSWER_INDEX',
	GAME_DATA_USER_ID_REQUIRED = 'GAME_DATA_USER_ID_REQUIRED',
	ARRAY_EMPTY_OR_ITEM_NOT_FOUND = 'ARRAY_EMPTY_OR_ITEM_NOT_FOUND',
	MISSING_CHART_ITEM = 'MISSING_CHART_ITEM',

	// Validation (difficulty, trivia, LanguageTool)
	CUSTOM_DIFFICULTY_VALIDATION_FAILED = 'CUSTOM_DIFFICULTY_VALIDATION_FAILED',
	FAILED_TO_CREATE_CUSTOM_DIFFICULTY_STRING = 'FAILED_TO_CREATE_CUSTOM_DIFFICULTY_STRING',
	TRIVIA_QUESTION_VALIDATION_FAILED = 'TRIVIA_QUESTION_VALIDATION_FAILED',
	LANGUAGETOOL_VALIDATION_REQUIRES_TEXT = 'LANGUAGETOOL_VALIDATION_REQUIRES_TEXT',
	LANGUAGETOOL_UNEXPECTED_RESPONSE = 'LANGUAGETOOL_UNEXPECTED_RESPONSE',

	// Analytics / Leaderboard
	INVALID_PERIOD = 'INVALID_PERIOD',
	NO_MIDDLEWARE_METRICS = 'NO_MIDDLEWARE_METRICS',
	NO_METRICS_FOUND = 'NO_METRICS_FOUND',
	TARGET_USER_ID_REQUIRED = 'TARGET_USER_ID_REQUIRED',
	EVENT_TYPE_REQUIRED = 'EVENT_TYPE_REQUIRED',

	// Storage / Cache
	KEY_REQUIRED = 'KEY_REQUIRED',
	REDIS_CLIENT_REQUIRED = 'REDIS_CLIENT_REQUIRED',
	CACHE_SYNC_ERROR = 'CACHE_SYNC_ERROR',
	REDIS_ERROR = 'REDIS_ERROR',

	// Multiplayer
	INVALID_ROOM_ID_FORMAT = 'INVALID_ROOM_ID_FORMAT',
	ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
	ONLY_HOST_CAN_START = 'ONLY_HOST_CAN_START',
	GAME_ALREADY_STARTED_OR_FINISHED = 'GAME_ALREADY_STARTED_OR_FINISHED',
	NEED_AT_LEAST_2_PLAYERS = 'NEED_AT_LEAST_2_PLAYERS',
	GAME_NOT_IN_PLAYING_STATE = 'GAME_NOT_IN_PLAYING_STATE',
	GAME_CANCELLED = 'GAME_CANCELLED',
	HOST_USER_NOT_FOUND = 'HOST_USER_NOT_FOUND',
	ROOM_NOT_ACCEPTING_PLAYERS = 'ROOM_NOT_ACCEPTING_PLAYERS',
	ROOM_FULL = 'ROOM_FULL',
	NOT_PART_OF_ROOM = 'NOT_PART_OF_ROOM',
	PLAYER_NOT_FOUND_IN_ROOM = 'PLAYER_NOT_FOUND_IN_ROOM',
	QUESTION_NOT_FOUND_OR_NOT_CURRENT = 'QUESTION_NOT_FOUND_OR_NOT_CURRENT',
	TIMER_ERROR = 'TIMER_ERROR',

	// Config / API
	DATABASE_PASSWORD_REQUIRED = 'DATABASE_PASSWORD_REQUIRED',
	NO_GROQ_MODEL_AVAILABLE = 'NO_GROQ_MODEL_AVAILABLE',
	API_KEY_NOT_CONFIGURED = 'API_KEY_NOT_CONFIGURED',
}

export const ERROR_MESSAGES = {
	general: {
		UNKNOWN_ERROR: 'An unknown error occurred.',
		REQUEST_FAILED: 'Request failed. Please try again.',
		INSUFFICIENT_RESOURCES: 'Insufficient resources. Please try again later.',
	},
	auth: {
		UNAUTHORIZED: 'You are not authorized to perform this action.',
		FORBIDDEN: 'Access denied. You do not have permission for this resource.',
		AUTHENTICATION_FAILED: 'Authentication failed. Please log in again.',
		PERMISSION_DENIED: 'Permission denied. Please contact support.',
	},
	user: {
		USER_ID_REQUIRED: 'User ID is required',
		USER_ID_REQUIRED_FOR_HISTORY: 'User ID is required to save game history',
		FIELD_NAME_REQUIRED: 'Field name is required',
		AVATAR_ID_OUT_OF_RANGE: 'Avatar ID must be 0 (clear) or between 1 and 16',
		SEARCH_QUERY_REQUIRED: 'Search query is required',
		PROFILE_DATA_REQUIRED: 'Profile data is required',
		FAILED_TO_RETRIEVE_USER_DATA: 'Failed to retrieve user data',
	},
	config: {
		DATABASE_PASSWORD_REQUIRED:
			'DATABASE_PASSWORD must be a non-empty string. Please set the DATABASE_PASSWORD environment variable.',
		MISSING_ENVIRONMENT_VARIABLES: (vars: string) =>
			`Missing required environment variables: ${vars}. Please set these variables before starting the application.`,
	},
	api: {
		NETWORK_ERROR: 'Network error occurred. Please check your connection.',
		NOT_FOUND: 'The requested resource was not found.',
		INTERNAL_SERVER_ERROR: 'An internal server error occurred. Please try again later.',
		RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
		INVALID_API_RESPONSE_STRUCTURE: 'Invalid API response structure',
		INVALID_ERROR_RESPONSE_FORMAT: 'Invalid error response format',
		INVALID_API_FALLBACK_RESPONSE_STRUCTURE: 'Invalid API fallback response structure',
		SESSION_EXPIRED: 'Session expired. Please login again.',
		NO_VALID_QUESTIONS_IN_RESPONSE: 'No valid questions in response',
		NO_QUESTIONS_RETURNED: 'No questions returned from API',
		TRIVIA_GENERATION_SLOW_OR_RATE_LIMIT:
			'Creating questions is taking longer than usual or the service is busy. Please try again in a moment or choose fewer questions.',
		NO_REFRESH_TOKEN_AVAILABLE: 'No refresh token available',
	},
	database: {
		DATABASE_OPERATION_FAILED: 'Database operation failed. Please try again later.',
	},
	client: {
		ROOT_ELEMENT_NOT_FOUND: 'Root element not found',
		ARRAY_EMPTY_OR_ITEM_NOT_FOUND: 'Array is empty or item not found',
	},
	payment: {
		INVALID_PAYPAL_ORDER_STATUS: (status: string) => `PayPal order status is ${status}, expected APPROVED or COMPLETED`,
		FAILED_TO_RETRIEVE_PAYMENT_HISTORY: 'Failed to retrieve payment history',
		PAYMENT_NOT_COMPLETED: 'Payment not completed',
		FAILED_TO_INITIALIZE_PAYPAL: 'Failed to initialize PayPal',
	},
	provider: {
		INVALID_GROQ_RESPONSE: 'Invalid Groq response format',
		UNABLE_TO_GENERATE_QUESTION: 'Unable to generate question',
		INVALID_PROVIDER_RESPONSE: 'Invalid response format from AI provider',
		AI_GENERATION_FAILED: 'Failed to generate question with AI providers',
		NO_GROQ_MODEL_AVAILABLE: 'No model available from GROQ_FREE_TIER_MODELS',
	},
	storage: {
		SERIALIZATION_FAILED: 'Serialization failed',
		DESERIALIZATION_FAILED: 'Deserialization failed',
		FILE_NOT_FOUND: 'Required file not found. Please contact support.',
		STORAGE_OPERATION_FAILED: 'Storage operation failed. Please try again.',
	},
	game: {
		INSUFFICIENT_CREDITS: 'Insufficient credits.',
		FAILED_TO_INITIALIZE_GAME_SESSION: (detail: string) => `Failed to initialize game session: ${detail}`,
		INVALID_ANSWER_INDEX: (maxIndex: number) => `Invalid answer value: must be a number between 0 and ${maxIndex}`,
		INVALID_ANSWER_INDEX_SERVER: (maxIndex: number, answerCount: number) =>
			`Invalid answer value: must be a number between 0 and ${maxIndex} (question has ${answerCount} answers)`,
		INSUFFICIENT_CREDITS_DETAIL: (available: number, required: number, detail: string) =>
			`Insufficient credits. You have ${available} credits available but need ${required} credits (${detail}).`,
		INVALID_GAME_SESSION_DATA_STRUCTURE: 'Invalid game session data structure',
	},
	cache: {
		CACHE_OPERATION_FAILED: 'Cache operation failed. Please try again.',
	},
	timeout: {
		REQUEST_TIMEOUT: 'Request timed out. Please try again.',
	},
	validation: {
		INPUT_VALIDATION_FAILED: 'Validation failed. Please check your input.',
		INVALID_INPUT_DATA: 'Invalid input data. Please check your information and try again.',
		GAME_ID_REQUIRED: 'Game ID is required',
		EVENT_TYPE_REQUIRED: 'Event type is required',
		ADMIN_ACCESS_DENIED: 'Access denied: Admin role required',
		INVALID_DIFFICULTY_LEVEL: (level: string) => `Invalid difficulty level: ${level}`,
		INVALID_GAME_MODE: (mode: string) => `Invalid game mode: ${mode}`,
		FAILED_TO_CREATE_CUSTOM_DIFFICULTY_STRING: 'Failed to create custom difficulty string',
		GAME_DATA_USER_ID_REQUIRED: 'userId is required in GameData',
		MISSING_CHART_ITEM: (name: string) => `Missing chart item for ${name}`,
		INVALID_PERIOD_VALID_LIST: (period: string) =>
			`Invalid period: ${period}. Valid periods are: weekly, monthly, yearly`,
		INVALID_PERIOD: (period: string) => `Invalid period: ${period}`,
		INVALID_FIELD: (field: string) => `Invalid field: ${field}`,
		TIME_LIMIT_RANGE: (min: number, max: number) =>
			`Time limit must be between ${min} and ${max} seconds for TIME_LIMITED mode`,
		QUESTIONS_PER_REQUEST_RANGE: (min: number, max: number, unlimited: number) =>
			`Questions per request must be between ${min} and ${max}, or ${unlimited} for unlimited mode`,
		MAX_PLAYERS_RANGE: (min: number, max: number) => `Max players must be between ${min} and ${max}`,
		// Dev-only (hook/context)
		USE_FORM_FIELD_WITHIN_FORM_FIELD: 'useFormField should be used within <FormField>',
		USE_FORM_FIELD_WITHIN_FORM_ITEM: 'useFormField should be used within <FormItem>',
	},
} as const;

export const NEST_EXCEPTION_NAMES = new Set<string>([
	'BadGatewayException',
	'BadRequestException',
	'ConflictException',
	'ForbiddenException',
	'GatewayTimeoutException',
	'GoneException',
	'HttpException',
	'HttpVersionNotSupportedException',
	'ImATeapotException',
	'InternalServerErrorException',
	'IntrinsicException',
	'MethodNotAllowedException',
	'MisdirectedException',
	'NotAcceptableException',
	'NotFoundException',
	'NotImplementedException',
	'PayloadTooLargeException',
	'PreconditionFailedException',
	'RequestTimeoutException',
	'ServiceUnavailableException',
	'UnauthorizedException',
	'UnprocessableEntityException',
	'UnsupportedMediaTypeException',
]);

export const HTTP_TIMEOUT_ERROR_CODES_SET = new Set<string>(['ECONNABORTED', 'ETIMEDOUT']);

export const HTTP_NETWORK_ERROR_CODES_SET = new Set<string>(['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET']);
