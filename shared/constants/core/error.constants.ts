/**
 * Error constants for EveryTriv
 * Used by both client and server
 *
 * @module ErrorConstants
 * @description Error messages and error handling constants
 * @used_by server/src/features/game/logic/providers/management, client/src/components/error
 */

// AI Provider error types (for type safety)
export const AI_PROVIDER_ERROR_TYPES = {
	PARSE_ERROR: 'An error occurred while processing the AI response',
	VALIDATION_ERROR: 'An error occurred while validating the question',
	API_ERROR: 'An error occurred while connecting to the AI service',
	UNKNOWN_ERROR: 'An unexpected error occurred while generating the question',
} as const;

// Common validation error messages
export const VALIDATION_ERRORS = {
	REQUIRED_FIELD: 'Field is required',
	REQUIRED_USER_ID: 'User ID is required',
	REQUIRED_USERNAME: 'Username is required',
	REQUIRED_EMAIL: 'Email is required',
	REQUIRED_PASSWORD: 'Password is required',
	REQUIRED_FIELD_AND_VALUE: 'Field and value are required',
	REQUIRED_PREFERENCE_AND_VALUE: 'Preference and value are required',
	REQUIRED_AMOUNT_AND_REASON: 'Amount and reason are required',
	REQUIRED_STATUS: 'Status is required',
	REQUIRED_USER_ID_AND_STATUS: 'User ID and status are required',
	INVALID_STATUS: 'Invalid status. Must be a valid user status',
	INVALID_ROLE: 'Invalid role. Must be a valid user role',
} as const;

// Fallback question answers
export const FALLBACK_QUESTION_ANSWERS = [
	{ text: 'Try again', isCorrect: true },
	{ text: 'Change topic', isCorrect: false },
	{ text: 'Change difficulty', isCorrect: false },
	{ text: 'Contact support', isCorrect: false },
] as const;

// Fallback question metadata
export const FALLBACK_QUESTION_METADATA = {
	QUESTION_COUNT: 4,
	IS_FALLBACK: true,
} as const;

// Error context messages
export const ERROR_CONTEXT_MESSAGES = {
	AI_GENERATION_FAILED: 'Failed to generate question with AI providers',
	PROVIDER_NOT_CONFIGURED: 'AI provider not configured',
	API_KEY_MISSING: 'API key not configured',
	INVALID_RESPONSE: 'Invalid response format from AI provider',
	QUESTION_GENERATION_FAILED: 'Failed to generate trivia question',
} as const;

// Error logging context
export const ERROR_LOGGING_CONTEXT = {
	AI_PROVIDERS: 'AiProvidersService',
	BASE_PROVIDER: 'BaseTriviaProvider',
	QUESTION_GENERATION: 'question_generation',
} as const;

// Payment error messages
export const PAYMENT_ERROR_MESSAGES = {
	FAILED_TO_RETRIEVE_PRICING_PLANS: 'Failed to retrieve pricing plans',
	FAILED_TO_RETRIEVE_POINT_OPTIONS: 'Failed to retrieve point purchase options',
	INVALID_PAYMENT_AMOUNT: 'Invalid payment amount',
	PAYMENT_PROCESSING_FAILED: 'Payment processing failed',
	FAILED_TO_RETRIEVE_PAYMENT_HISTORY: 'Failed to retrieve payment history',
	FAILED_TO_RETRIEVE_SUBSCRIPTION: 'Failed to retrieve subscription details',
	INVALID_POINT_OPTION: 'Invalid point purchase option',
	PAYMENT_FAILED: 'Payment failed',
	USER_NOT_FOUND: 'User not found',
	FAILED_TO_PURCHASE_POINTS: 'Failed to purchase points',
	INVALID_PLAN_TYPE: 'Invalid plan type',
	FAILED_TO_CREATE_SUBSCRIPTION: 'Failed to create subscription',
	NO_ACTIVE_SUBSCRIPTION: 'No active subscription found',
	FAILED_TO_CANCEL_SUBSCRIPTION: 'Failed to cancel subscription',
} as const;

// Game error messages
export const GAME_ERROR_MESSAGES = {
	FAILED_TO_GENERATE_QUESTION: 'Failed to generate question with AI providers',
	QUESTION_NOT_FOUND: 'Question not found',
	FAILED_TO_GET_QUESTION: 'Failed to get question',
	FAILED_TO_SUBMIT_ANSWER: 'Failed to submit answer',
	FAILED_TO_GET_ANALYTICS: 'Failed to get user analytics',
	FAILED_TO_GET_LEADERBOARD: 'Failed to get leaderboard',
	FAILED_TO_UPDATE_SCORE: 'Failed to update user score',
	FAILED_TO_GET_SCORE_DATA: 'Failed to get user score data',
	GAME_NOT_FOUND: 'Game not found',
	INSUFFICIENT_POINTS: 'Insufficient points',
	FAILED_TO_SAVE_CONFIG: 'Failed to save game configuration',
} as const;

// Storage error messages
export const STORAGE_ERROR_MESSAGES = {
	SERIALIZATION_FAILED: 'Serialization failed',
	DESERIALIZATION_FAILED: 'Deserialization failed',
	FAILED_TO_GET_KEYS: 'Failed to get keys',
	FAILED_TO_GET_ITEM: 'Failed to get item',
	FAILED_TO_CLEAR_STORAGE: 'Failed to clear storage',
} as const;

// Cache error messages
export const CACHE_ERROR_MESSAGES = {
	FAILED_TO_GET: 'Failed to get from cache',
	FAILED_TO_SET: 'Failed to set cache',
	FAILED_TO_DELETE: 'Failed to delete from cache',
	FAILED_TO_CLEAR: 'Failed to clear cache',
	CONNECTION_FAILED: 'Cache connection failed',
} as const;

// Timeout error messages
export const TIMEOUT_ERROR_MESSAGES = {
	OPERATION_TIMEOUT: 'Operation timed out',
	REQUEST_TIMEOUT: 'Request timed out',
	DATABASE_TIMEOUT: 'Database operation timed out',
	CACHE_TIMEOUT: 'Cache operation timed out',
} as const;

// Provider error messages
export const PROVIDER_ERROR_MESSAGES = {
	INVALID_ANTHROPIC_RESPONSE: 'Invalid Anthropic response format',
	INVALID_GOOGLE_RESPONSE: 'Invalid Google response format',
	INVALID_MISTRAL_RESPONSE: 'Invalid Mistral response format',
	INVALID_OPENAI_RESPONSE: 'Invalid OpenAI response format',
	NO_PROVIDERS_AVAILABLE: 'No AI providers available',
	API_KEY_NOT_CONFIGURED: 'API key not configured',
} as const;

// Analytics error messages
export const ANALYTICS_ERROR_MESSAGES = {
	USER_NOT_FOUND: 'User not found',
} as const;

// Validation error messages
export const VALIDATION_ERROR_MESSAGES = {
	LANGUAGETOOL_API_ERROR: 'LanguageTool API error',
	FAILED_TO_FETCH_LANGUAGES: 'Failed to fetch languages',
	REQUIRED: 'This field is required',
	INVALID_EMAIL: 'Please enter a valid email address',
	INVALID_PASSWORD: 'Password must be at least 8 characters long',
	INVALID_USERNAME: 'Username must be between 3 and 20 characters',
	INVALID_TOPIC: 'Please enter a valid topic',
	INVALID_DIFFICULTY: 'Please select a valid difficulty level',
	INVALID_CUSTOM_DIFFICULTY: 'Please enter a valid custom difficulty description',
} as const;

/**
 * Common error messages
 * @constant
 * @description Common error messages used across the application
 * @used_by client/src/services/api.service.ts, server/src/common/filters/http-exception.filter.ts
 */
export const COMMON_ERROR_MESSAGES = {
	NETWORK_ERROR: 'Network error occurred. Please check your connection.',
	UNAUTHORIZED: 'You are not authorized to perform this action.',
	FORBIDDEN: 'Access denied. You do not have permission for this resource.',
	NOT_FOUND: 'The requested resource was not found.',
	INTERNAL_SERVER_ERROR: 'An internal server error occurred. Please try again later.',
	VALIDATION_ERROR: 'Validation failed. Please check your input.',
	RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
	TIMEOUT: 'Request timed out. Please try again.',
} as const;

/**
 * NestJS exception names array
 * @constant
 * @description Array of NestJS exception names used for error handling
 * @used_by shared/utils/error.utils.ts
 */
export const NEST_EXCEPTION_NAMES = [
	'BadRequestException',
	'NotFoundException',
	'InternalServerErrorException',
	'UnauthorizedException',
	'ForbiddenException',
] as const;
