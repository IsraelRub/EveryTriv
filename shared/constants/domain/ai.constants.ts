export enum LLMResponseStatus {
	SUCCESS = 'success',
	ERROR = 'error',
}

export enum ProviderHealthStatus {
	HEALTHY = 'healthy',
	UNHEALTHY = 'unhealthy',
	UNAVAILABLE = 'unavailable',
	AVAILABLE = 'available',
}

export const PROVIDER_HEALTH_STATUSES = Object.values(ProviderHealthStatus);
