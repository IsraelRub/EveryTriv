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

export interface AiProviderStats {
	totalProviders: number;
	currentProviderIndex: number;
	providers: string[];
	providerDetails: Record<string, ProviderDetails>;
	timestamp: string;
}

export interface AiProviderHealth {
	status: string;
	availableProviders: number;
	totalProviders: number;
	timestamp: string;
	error?: string;
}
