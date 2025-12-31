/**
 * AI Domain Constants
 *
 * @module AIDomainConstants
 * @description Enumerations that describe AI provider and LLM statuses
 */

/**
 * LLM response status enumeration
 * @enum LLMResponseStatus
 * @description Status values returned from LLM providers
 */
export enum LLMResponseStatus {
	SUCCESS = 'success',
	ERROR = 'error',
}

/**
 * Provider health status enumeration
 * @enum ProviderHealthStatus
 * @description Health state of AI providers exposed to clients
 */
export enum ProviderHealthStatus {
	HEALTHY = 'healthy',
	UNHEALTHY = 'unhealthy',
	UNAVAILABLE = 'unavailable',
	AVAILABLE = 'available',
}

/**
 * Array of all provider health statuses
 * @constant PROVIDER_HEALTH_STATUSES
 * @description Convenience list for validation and filtering logic
 */
export const PROVIDER_HEALTH_STATUSES = Object.values(ProviderHealthStatus);

