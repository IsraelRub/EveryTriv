/**
 * AI Provider Types for EveryTriv
 * Shared between client and server
 */

/**
 * Provider statistics details interface
 * @interface ProviderDetails
 * @description Statistics for a single AI provider
 * @used_by client/src/services/domain/admin.service.ts, client/src/views/admin/AdminDashboard.tsx
 */
export interface ProviderDetails {
	status?: string;
	requests?: number;
	successes?: number;
	failures?: number;
	successRate?: number;
	averageResponseTime?: number;
	errorRate?: number;
	lastUsed?: string;
}

/**
 * AI provider statistics response interface
 * @interface AiProviderStats
 * @description Statistics response for AI providers including totals, current provider, and details
 * @used_by client/src/services/domain/admin.service.ts, client/src/views/admin/AdminDashboard.tsx
 */
export interface AiProviderStats {
	totalProviders: number;
	currentProviderIndex: number;
	providers: string[];
	providerDetails: Record<string, ProviderDetails>;
	timestamp: string;
}

/**
 * AI provider health status interface
 * @interface AiProviderHealth
 * @description Health status response for AI providers
 * @used_by client/src/services/domain/admin.service.ts, client/src/views/admin/AdminDashboard.tsx
 */
export interface AiProviderHealth {
	status: string;
	availableProviders: number;
	totalProviders: number;
	timestamp: string;
	error?: string;
}
