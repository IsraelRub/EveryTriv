export const HTTP_CLIENT_CONFIG = {
	TIMEOUT: 30000, // 30 seconds
	RETRY_ATTEMPTS: 3,
	RETRY_ATTEMPTS_RATE_LIMIT: 5, // More attempts for rate limit errors
	RETRY_DELAY: 1000, // 1 second
	RETRY_DELAY_RATE_LIMIT: 5000, // 5 seconds minimum for rate limit errors
	DEFAULT_HEADERS: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
} as const;

export const HTTP_TIMEOUTS = {
	QUESTION_GENERATION: 30000, // 30 seconds
	AI_PROVIDER: 30000, // 30 seconds
	UPLOAD: 60000, // 60 seconds
} as const;

export const HTTP_STATUS_CODES = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
	GATEWAY_TIMEOUT: 504,
	SERVER_ERROR_MIN: 500,
	SERVER_ERROR_MAX: 599,
} as const;

export enum HttpMethod {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	PATCH = 'PATCH',
	DELETE = 'DELETE',
	OPTIONS = 'OPTIONS',
}

export const HTTP_ERROR_MESSAGES = {
	NETWORK_ERROR: 'Network error occurred. Please check your connection.', // Same as ERROR_MESSAGES.general.NETWORK_ERROR
	UNKNOWN_ERROR: 'An unknown error occurred.', // Same as ERROR_MESSAGES.general.UNKNOWN_ERROR
	TIMEOUT_ERROR: 'Request timed out. Please try again.', // Same as ERROR_MESSAGES.general.TIMEOUT
	SERVER_ERROR: 'Server error occurred. Please try again later.', // Similar to ERROR_MESSAGES.general.INTERNAL_SERVER_ERROR
} as const;
