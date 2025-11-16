/**
 * HTTP client constants for EveryTriv
 * Used by both client and server
 *
 * @module HttpConstants
 * @description HTTP configuration and status code constants
 * @used_by client/src/services, shared/services
 */
import { ENV_FALLBACKS, ENV_VAR_NAMES, LOCALHOST_URLS } from './localhost.constants';

// API base URL configuration
export const API_BASE_URL = {
	DEVELOPMENT: LOCALHOST_URLS.API_BASE,
	PRODUCTION: process.env[ENV_VAR_NAMES.API_BASE_URL] || ENV_FALLBACKS.API_BASE_URL,
	STAGING: process.env[ENV_VAR_NAMES.API_BASE_URL] || ENV_FALLBACKS.API_BASE_URL,
} as const;

// HTTP client configuration
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

// HTTP timeout constants
export const HTTP_TIMEOUTS = {
	DEFAULT: 30000, // 30 seconds
	QUESTION_GENERATION: 30000, // 30 seconds
	AI_PROVIDER: 30000, // 30 seconds
	UPLOAD: 60000, // 60 seconds
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
