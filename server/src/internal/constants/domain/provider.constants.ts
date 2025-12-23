/**
 * Provider Constants for EveryTriv (Server-only)
 */

/**
 * Provider error type enumeration
 */
export enum ProviderErrorType {
	PARSE_ERROR = 'PARSE_ERROR',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	API_ERROR = 'API_ERROR',
	UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Provider event type enumeration
 */
export enum ProviderEventType {
	REQUEST = 'request',
	SUCCESS = 'success',
	FAILURE = 'failure',
}

/**
 * LLM response status enumeration
 */
export enum LLMResponseStatus {
	SUCCESS = 'success',
	ERROR = 'error',
}

/**
 * Provider health status enumeration
 * @enum ProviderHealthStatus
 * @description Health status of AI providers
 */
export enum ProviderHealthStatus {
	HEALTHY = 'healthy',
	UNHEALTHY = 'unhealthy',
	UNAVAILABLE = 'unavailable',
	AVAILABLE = 'available',
}
