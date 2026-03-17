export interface ProviderAuthError extends Error {
	statusCode?: number;
	isAuthError: true;
	provider?: string;
}

export interface ProviderRateLimitError extends Error {
	statusCode?: number;
	isRateLimitError: true;
	retryAfter?: number;
	provider?: string;
}
