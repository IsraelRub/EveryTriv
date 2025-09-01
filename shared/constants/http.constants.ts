/**
 * HTTP client constants for EveryTriv
 * Used by both client and server
 *
 * @module HttpConstants
 * @description HTTP configuration and status code constants
 * @used_by server: server/src/shared/services/http-client.ts (HttpClient), client: client/src/services/http-client.ts (ClientHttpClient), shared/services/logging.service.ts (HTTP logging)
 */

// HTTP client configuration
export const HTTP_CLIENT_CONFIG = {
	TIMEOUT: 30000, // 30 seconds
	RETRY_ATTEMPTS: 3,
	RETRY_DELAY: 1000, // 1 second
	DEFAULT_HEADERS: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
} as const;

// HTTP status codes
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

// HTTP error codes
export const HTTP_ERROR_CODES = {
	NETWORK_ERROR: 'NETWORK_ERROR',
	UNKNOWN_ERROR: 'UNKNOWN_ERROR',
	TIMEOUT_ERROR: 'TIMEOUT_ERROR',
	SERVER_ERROR: 'SERVER_ERROR',
	DEFAULT: 'UNKNOWN_ERROR',
} as const;

// HTTP error messages
export const HTTP_ERROR_MESSAGES = {
	NETWORK_ERROR: 'Network error occurred. Please check your connection.',
	UNKNOWN_ERROR: 'An unknown error occurred.',
	TIMEOUT_ERROR: 'Request timed out. Please try again.',
	SERVER_ERROR: 'Server error occurred. Please try again later.',
	DEFAULT: 'An unknown error occurred.',
} as const;

// HTTP log messages
export const HTTP_LOG_MESSAGES = {
	REQUEST: 'HTTP Request',
	REQUEST_ERROR: 'HTTP Request Error',
	RESPONSE: 'HTTP Response',
	RESPONSE_ERROR: 'HTTP Response Error',
	RETRY_ATTEMPT: 'HTTP Retry Attempt',
	RETRY_FAILED: 'HTTP Retry Failed',
} as const;
