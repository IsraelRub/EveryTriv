export type GroqApiCallOptions = Readonly<{
	maxTokens?: number;
	timeoutMs?: number;
}>;

export interface GroqMessageForLog {
	role?: string;
	content?: unknown;
}

export interface GroqModelConfig {
	priority: number;
	cost: number;
	name: string;
	rateLimit?: {
		requestsPerMinute: number;
		requestsPerDay?: number;
		tokensPerMinute?: number;
	};
	availableInFreeTier?: boolean;
	maxTokens?: number;
}
