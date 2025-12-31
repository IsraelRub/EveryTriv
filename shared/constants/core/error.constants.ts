/**
 * Error constants for EveryTriv
 * Used by both client and server
 *
 * @module ErrorConstants
 * @description Error messages and error handling constants
 * @used_by server/src/features/game/logic/providers/management, client/src/components/error
 */

// Error codes for application errors
export const ERROR_CODES = {
	AI_PROVIDERS_FAILED: 'AI_PROVIDERS_FAILED',
	NETWORK_ERROR: 'NETWORK_ERROR',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	NOT_FOUND: 'NOT_FOUND',
	UNAUTHORIZED: 'UNAUTHORIZED',
	FORBIDDEN: 'FORBIDDEN',
	INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
	// Payment errors
	PAYMENT_PROCESSING_FAILED: 'PAYMENT_PROCESSING_FAILED',
	FAILED_TO_PURCHASE_CREDITS: 'FAILED_TO_PURCHASE_CREDITS',
	PAYMENT_AMOUNT_REQUIRED: 'PAYMENT_AMOUNT_REQUIRED',
	PAYMENT_INTENT_ID_AND_CREDITS_REQUIRED: 'PAYMENT_INTENT_ID_AND_CREDITS_REQUIRED',
	// Authentication errors
	USER_NOT_AUTHENTICATED: 'USER_NOT_AUTHENTICATED',
	INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
	AUTHENTICATION_RESULT_INCOMPLETE: 'AUTHENTICATION_RESULT_INCOMPLETE',
	AUTHENTICATION_TOKEN_REQUIRED: 'AUTHENTICATION_TOKEN_REQUIRED',
	INVALID_AUTHENTICATION_TOKEN: 'INVALID_AUTHENTICATION_TOKEN',
	AUTHENTICATION_FAILED_GENERIC: 'AUTHENTICATION_FAILED_GENERIC',
	INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
	// User errors
	EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
	USER_NOT_FOUND_OR_AUTH_FAILED: 'USER_NOT_FOUND_OR_AUTH_FAILED',
	USER_ACCOUNT_DISABLED: 'USER_ACCOUNT_DISABLED',
	USER_DATA_VALIDATION_FAILED: 'USER_DATA_VALIDATION_FAILED',
	AVATAR_ID_OUT_OF_RANGE: 'AVATAR_ID_OUT_OF_RANGE',
	SEARCH_QUERY_TOO_SHORT: 'SEARCH_QUERY_TOO_SHORT',
	// Password errors
	PASSWORD_NOT_SET: 'PASSWORD_NOT_SET',
	CURRENT_PASSWORD_INCORRECT: 'CURRENT_PASSWORD_INCORRECT',
	CURRENT_PASSWORD_AND_NEW_PASSWORD_REQUIRED: 'CURRENT_PASSWORD_AND_NEW_PASSWORD_REQUIRED',
	// Credits errors
	INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
	INVALID_USER_ID: 'INVALID_USER_ID',
	INVALID_PACKAGE_ID: 'INVALID_PACKAGE_ID',
	INVALID_CREDITS_PACKAGE: 'INVALID_CREDITS_PACKAGE',
	INVALID_CREDITS_AMOUNT: 'INVALID_CREDITS_AMOUNT',
	INVALID_PAYMENT_INTENT_ID: 'INVALID_PAYMENT_INTENT_ID',
	// Game errors
	INVALID_GAME_MODE: 'INVALID_GAME_MODE',
	INVALID_QUESTION_ID_FORMAT: 'INVALID_QUESTION_ID_FORMAT',
	INVALID_GAME_ID_FORMAT: 'INVALID_GAME_ID_FORMAT',
	FAILED_TO_SAVE_CONFIG: 'FAILED_TO_SAVE_CONFIG',
	INVALID_QUESTION_FORMAT: 'INVALID_QUESTION_FORMAT',
	INVALID_QUESTION_FORMAT_FROM_AI: 'INVALID_QUESTION_FORMAT_FROM_AI',
	NO_CORRECT_ANSWER_FOUND: 'NO_CORRECT_ANSWER_FOUND',
	AI_RETURNED_EMPTY_RESPONSE: 'AI_RETURNED_EMPTY_RESPONSE',
	// Analytics/Leaderboard errors
	INVALID_PERIOD: 'INVALID_PERIOD',
	NO_MIDDLEWARE_METRICS: 'NO_MIDDLEWARE_METRICS',
	NO_METRICS_FOUND: 'NO_METRICS_FOUND',
	TARGET_USER_ID_REQUIRED: 'TARGET_USER_ID_REQUIRED',
	// Storage/Cache errors
	KEY_REQUIRED: 'KEY_REQUIRED',
	REDIS_CLIENT_REQUIRED: 'REDIS_CLIENT_REQUIRED',
	// Migration errors
	ROLLBACK_NOT_SUPPORTED: 'ROLLBACK_NOT_SUPPORTED',
	// Authentication & Tokens
	ACCOUNT_IS_INACTIVE: 'ACCOUNT_IS_INACTIVE',
	TOKEN_GENERATION_FAILED: 'TOKEN_GENERATION_FAILED',
	TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
	GOOGLE_PROFILE_MISSING_IDENTIFIER: 'GOOGLE_PROFILE_MISSING_IDENTIFIER',
	GOOGLE_PROFILE_INVALID_FORMAT: 'GOOGLE_PROFILE_INVALID_FORMAT',
	GOOGLE_PROFILE_INVALID_FORMAT_BUFFER: 'GOOGLE_PROFILE_INVALID_FORMAT_BUFFER',
	GOOGLE_PROFILE_INVALID_FORMAT_STRING: 'GOOGLE_PROFILE_INVALID_FORMAT_STRING',
	PARSED_BUFFER_NOT_VALID_PROFILE: 'PARSED_BUFFER_NOT_VALID_PROFILE',
	PARSED_STRING_NOT_VALID_PROFILE: 'PARSED_STRING_NOT_VALID_PROFILE',
	PROFILE_ID_MISSING: 'PROFILE_ID_MISSING',
	PROFILE_RESPONSE_MISSING: 'PROFILE_RESPONSE_MISSING',
	PROFILE_DATA_MISSING: 'PROFILE_DATA_MISSING',
	GOOGLE_PROFILE_ID_MISSING: 'GOOGLE_PROFILE_ID_MISSING',
	// Payment
	PASSWORD_HASH_FAILED: 'PASSWORD_HASH_FAILED',
	CARD_DETAILS_REQUIRED: 'CARD_DETAILS_REQUIRED',
	INCOMPLETE_PAYMENT_INFO: 'INCOMPLETE_PAYMENT_INFO',
	PAYPAL_ORDER_ID_REQUIRED: 'PAYPAL_ORDER_ID_REQUIRED',
	// Validation
	CUSTOM_DIFFICULTY_VALIDATION_FAILED: 'CUSTOM_DIFFICULTY_VALIDATION_FAILED',
	TRIVIA_QUESTION_VALIDATION_FAILED: 'TRIVIA_QUESTION_VALIDATION_FAILED',
	LANGUAGETOOL_VALIDATION_REQUIRES_TEXT: 'LANGUAGETOOL_VALIDATION_REQUIRES_TEXT',
	LANGUAGETOOL_UNEXPECTED_RESPONSE: 'LANGUAGETOOL_UNEXPECTED_RESPONSE',
	// Multiplayer
	ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
	ONLY_HOST_CAN_START: 'ONLY_HOST_CAN_START',
	GAME_ALREADY_STARTED_OR_FINISHED: 'GAME_ALREADY_STARTED_OR_FINISHED',
	NEED_AT_LEAST_2_PLAYERS: 'NEED_AT_LEAST_2_PLAYERS',
	GAME_NOT_IN_PLAYING_STATE: 'GAME_NOT_IN_PLAYING_STATE',
	GAME_CANCELLED: 'GAME_CANCELLED',
	HOST_USER_NOT_FOUND: 'HOST_USER_NOT_FOUND',
	ROOM_NOT_ACCEPTING_PLAYERS: 'ROOM_NOT_ACCEPTING_PLAYERS',
	ROOM_FULL: 'ROOM_FULL',
	NOT_PART_OF_ROOM: 'NOT_PART_OF_ROOM',
	PLAYER_NOT_FOUND_IN_ROOM: 'PLAYER_NOT_FOUND_IN_ROOM',
	QUESTION_NOT_FOUND_OR_NOT_CURRENT: 'QUESTION_NOT_FOUND_OR_NOT_CURRENT',
	// Game
	QUESTION_ID_REQUIRED: 'QUESTION_ID_REQUIRED',
	QUESTION_ID_AND_ANSWER_REQUIRED: 'QUESTION_ID_AND_ANSWER_REQUIRED',
	SCORE_REQUIRED: 'SCORE_REQUIRED',
	GAME_ID_REQUIRED: 'GAME_ID_REQUIRED',
	QUESTION_GENERATION_TIMEOUT: 'QUESTION_GENERATION_TIMEOUT',
	RESPONSE_CONTENT_EMPTY: 'RESPONSE_CONTENT_EMPTY',
	// Credits
	VALID_QUESTIONS_PER_REQUEST_REQUIRED: 'VALID_QUESTIONS_PER_REQUEST_REQUIRED',
	QUESTIONS_PER_REQUEST_REQUIRED: 'QUESTIONS_PER_REQUEST_REQUIRED',
	PACKAGE_ID_REQUIRED: 'PACKAGE_ID_REQUIRED',
	LIMIT_OUT_OF_RANGE: 'LIMIT_OUT_OF_RANGE',
	LIMIT_CANNOT_EXCEED_100: 'LIMIT_CANNOT_EXCEED_100',
	LIMIT_CANNOT_EXCEED_1000: 'LIMIT_CANNOT_EXCEED_1000',
	// Analytics
	EVENT_TYPE_REQUIRED: 'EVENT_TYPE_REQUIRED',
	// User
	REQUIRED_FIELD_AND_VALUE: 'REQUIRED_FIELD_AND_VALUE',
	REQUIRED_PREFERENCE_AND_VALUE: 'REQUIRED_PREFERENCE_AND_VALUE',
	REQUIRED_USER_ID: 'REQUIRED_USER_ID',
	REQUIRED_AMOUNT_AND_REASON: 'REQUIRED_AMOUNT_AND_REASON',
	REQUIRED_USER_ID_AND_STATUS: 'REQUIRED_USER_ID_AND_STATUS',
	INVALID_STATUS: 'INVALID_STATUS',
	// API Routes
	API_KEY_NOT_CONFIGURED: 'API_KEY_NOT_CONFIGURED',
} as const;

/**
 * Error messages organized by category
 * @constant
 * @description Structured error messages for different application domains
 *
 * @methodology Error Messages Usage Guidelines
 * @description When to use each category:
 *
 * **ERROR_MESSAGES.general.*** - General application errors, used by both client and server
 * - Use for: Authentication failures, network errors, database errors, cache errors
 * - Examples: AUTHENTICATION_FAILED, NETWORK_ERROR, DATABASE_OPERATION_FAILED
 *
 * **ERROR_MESSAGES.api.*** - API-specific errors (client-side API calls)
 * - Use for: Invalid API responses, session expiration, API structure errors, API operation failures
 * - Examples: INVALID_API_RESPONSE_STRUCTURE, SESSION_EXPIRED, FAILED_TO_STORE_AUTH_TOKEN
 *
 * **ERROR_MESSAGES.validation.*** - Server-side validation errors
 * - Use for: Validation errors from server (not UI validation), input validation errors
 * - Examples: INVALID_EMAIL, REQUIRED, USER_ID_REQUIRED, AVATAR_ID_OUT_OF_RANGE
 *
 * **ERROR_MESSAGES.[category].*** - Domain-specific errors
 * - Use for: Payment, game, provider, storage, cache, timeout, analytics errors
 *
 * @used_by server/src/features, shared/utils, client/src/services
 */
export const ERROR_MESSAGES = {
	general: {
		UNKNOWN_ERROR: 'An unknown error occurred.',
		NETWORK_ERROR: 'Network error occurred. Please check your connection.',
		UNAUTHORIZED: 'You are not authorized to perform this action.',
		FORBIDDEN: 'Access denied. You do not have permission for this resource.',
		NOT_FOUND: 'The requested resource was not found.',
		INTERNAL_SERVER_ERROR: 'An internal server error occurred. Please try again later.',
		VALIDATION_ERROR: 'Validation failed. Please check your input.',
		RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
		TIMEOUT: 'Request timed out. Please try again.',
		// Authentication and system errors
		AUTHENTICATION_FAILED: 'Authentication failed. Please log in again.',
		DATABASE_OPERATION_FAILED: 'Database operation failed. Please try again later.',
		CACHE_OPERATION_FAILED: 'Cache operation failed. Please try again.',
		INVALID_INPUT_DATA: 'Invalid input data. Please check your information and try again.',
		INSUFFICIENT_RESOURCES: 'Insufficient resources. Please try again later.',
		FILE_NOT_FOUND: 'Required file not found. Please contact support.',
		PERMISSION_DENIED: 'Permission denied. Please contact support.',
		REQUEST_FAILED: 'Request failed. Please try again.',
		ROOT_ELEMENT_NOT_FOUND: 'Root element not found',
	},
	api: {
		INVALID_API_RESPONSE_STRUCTURE: 'Invalid API response structure',
		INVALID_ERROR_RESPONSE_FORMAT: 'Invalid error response format',
		INVALID_API_FALLBACK_RESPONSE_STRUCTURE: 'Invalid API fallback response structure',
		SESSION_EXPIRED: 'Session expired. Please login again.',
		NO_VALID_QUESTIONS_IN_RESPONSE: 'No valid questions in response',
		NO_QUESTIONS_RETURNED: 'No questions returned from API',
		FAILED_TO_STORE_AUTH_TOKEN: 'Failed to store authentication token',
		FAILED_TO_RETRIEVE_USER_DATA: 'Failed to retrieve user data',
		NO_REFRESH_TOKEN_AVAILABLE: 'No refresh token available',
		NO_USER_DATA_FOUND: 'No user data found',
		PROFILE_RESPONSE_MISSING: 'Profile response is missing',
		PROFILE_DATA_MISSING: 'Profile data is missing',
	},
	payment: {
		FAILED_TO_RETRIEVE_PRICING_PLANS: 'Failed to retrieve pricing plans',
		FAILED_TO_RETRIEVE_CREDIT_OPTIONS: 'Failed to retrieve credit purchase options',
		INVALID_PAYMENT_AMOUNT: 'Invalid payment amount',
		PAYMENT_PROCESSING_FAILED: 'Payment processing failed',
		FAILED_TO_RETRIEVE_PAYMENT_HISTORY: 'Failed to retrieve payment history',
		FAILED_TO_RETRIEVE_SUBSCRIPTION: 'Failed to retrieve subscription details',
		INVALID_CREDIT_OPTION: 'Invalid credit purchase option',
		PAYMENT_FAILED: 'Payment failed',
		USER_NOT_FOUND: 'User not found',
		FAILED_TO_PURCHASE_CREDITS: 'Failed to purchase credits',
		INVALID_PLAN_TYPE: 'Invalid plan type',
		FAILED_TO_CREATE_SUBSCRIPTION: 'Failed to create subscription',
		NO_ACTIVE_SUBSCRIPTION: 'No active subscription found',
		FAILED_TO_CANCEL_SUBSCRIPTION: 'Failed to cancel subscription',
	},
	provider: {
		INVALID_CLAUDE_RESPONSE: 'Invalid Claude response format',
		INVALID_GEMINI_RESPONSE: 'Invalid Gemini response format',
		INVALID_CHATGPT_RESPONSE: 'Invalid ChatGPT response format',
		INVALID_GROQ_RESPONSE: 'Invalid Groq response format',
		NO_PROVIDERS_AVAILABLE: 'No AI providers available',
		API_KEY_NOT_CONFIGURED: 'API key not configured',
		AUTH_FAILED: 'Authentication failed - invalid or missing API key',
		RATE_LIMIT_EXCEEDED: 'Rate limit exceeded - too many requests',
		ALL_PROVIDERS_FAILED: 'All AI providers failed - unable to generate question',
		RESPONSE_CONTENT_EMPTY: 'Response content is empty',
		INVALID_QUESTION_FORMAT: 'Response does not contain valid question format',
		UNABLE_TO_GENERATE_QUESTION: 'Unable to generate question',
		INVALID_RESPONSE: 'Invalid response format from AI provider',
		AI_GENERATION_FAILED: 'Failed to generate question with AI providers',
	},
	storage: {
		SERIALIZATION_FAILED: 'Serialization failed',
		DESERIALIZATION_FAILED: 'Deserialization failed',
		FAILED_TO_GET_KEYS: 'Failed to get keys',
		FAILED_TO_GET_ITEM: 'Failed to get item',
		FAILED_TO_CLEAR_STORAGE: 'Failed to clear storage',
	},
	game: {
		FAILED_TO_GENERATE_QUESTION: 'Failed to generate question with AI providers',
		QUESTION_NOT_FOUND: 'Question not found',
		FAILED_TO_GET_QUESTION: 'Failed to get question',
		FAILED_TO_SUBMIT_ANSWER: 'Failed to submit answer',
		FAILED_TO_GET_ANALYTICS: 'Failed to get user analytics',
		FAILED_TO_GET_LEADERBOARD: 'Failed to get leaderboard',
		FAILED_TO_UPDATE_SCORE: 'Failed to update user score',
		FAILED_TO_GET_SCORE_DATA: 'Failed to get user score data',
		GAME_NOT_FOUND: 'Game not found',
		INSUFFICIENT_CREDITS: 'Insufficient credits',
		FAILED_TO_SAVE_CONFIG: 'Failed to save game configuration',
	},
	cache: {
		FAILED_TO_GET: 'Failed to get from cache',
		FAILED_TO_SET: 'Failed to set cache',
		FAILED_TO_DELETE: 'Failed to delete from cache',
		FAILED_TO_CLEAR: 'Failed to clear cache',
		CONNECTION_FAILED: 'Cache connection failed',
	},
	timeout: {
		OPERATION_TIMEOUT: 'Operation timed out',
		REQUEST_TIMEOUT: 'Request timed out',
		DATABASE_TIMEOUT: 'Database operation timed out',
		CACHE_TIMEOUT: 'Cache operation timed out',
	},
	analytics: {
		USER_NOT_FOUND: 'User not found',
	},
	validation: {
		LANGUAGETOOL_API_ERROR: 'LanguageTool API error',
		FAILED_TO_FETCH_LANGUAGES: 'Failed to fetch languages',
		REQUIRED: 'This field is required',
		INVALID_EMAIL: 'Please enter a valid email address',
		INVALID_PASSWORD: 'Password must be between 6 and 15 characters long',
		INVALID_USERNAME: 'Username must be between 3 and 20 characters',
		INVALID_TOPIC: 'Please enter a valid topic',
		INVALID_DIFFICULTY: 'Please select a valid difficulty level',
		INVALID_CUSTOM_DIFFICULTY: 'Please enter a valid custom difficulty description',
		// Additional validation messages
		USER_ID_REQUIRED: 'User ID is required',
		FIELD_NAME_REQUIRED: 'Field name is required',
		USER_ID_REQUIRED_FOR_HISTORY: 'User ID is required to save game history',
		AVATAR_ID_OUT_OF_RANGE: 'Avatar ID must be between 1 and 16',
		SEARCH_QUERY_REQUIRED: 'Search query is required',
		PROFILE_DATA_REQUIRED: 'Profile data is required',
		LOGS_ARRAY_REQUIRED: 'Logs array is required and must not be empty',
		GAME_ID_REQUIRED: 'Game ID is required',
		EVENT_TYPE_REQUIRED: 'Event type is required',
		ADMIN_ACCESS_DENIED: 'Access denied: Admin role required',
		INVALID_DIFFICULTY_LEVEL: (level: string) => `Invalid difficulty level: ${level}`,
		INVALID_GAME_MODE: (mode: string) => `Invalid game mode: ${mode}`,
	},
} as const;

/**
 * NestJS exception names array
 * @constant
 * @description Array of NestJS exception names used for error handling
 * @used_by shared/utils/error.utils.ts
 */
export const NEST_EXCEPTION_NAMES = [
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
] as const;
