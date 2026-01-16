export interface JitterOptions {
	percentage?: number;
	maxJitter?: number;
	fixedJitter?: number;
}

export interface RetryOptions {
	useExponentialBackoff?: boolean;
	exponentBase?: number;
	minDelay?: number;
	maxDelay?: number;
	retryAfter?: number;
	jitter?: JitterOptions;
}

export interface RetryConfig {
	maxRetries?: number;
	baseDelay?: number;
	timeout?: number;
	retryOptions?: RetryOptions;
	retryOnAuthError?: boolean;
	retryOnRateLimit?: boolean;
	retryOnServerError?: boolean;
	retryOnNetworkError?: boolean;
	signal?: AbortSignal;
	responseHeaders?: Headers;
	shouldRetry?: (error: unknown, statusCode: number | null, attempt: number) => boolean;
	onRetry?: (attempt: number, error: unknown, delay: number) => void;
	onError?: (error: unknown, attempt: number, isFinal: boolean) => void;
}

export interface RetryResponse<T> {
	data: T;
	attempts: number;
	duration: number;
	retryDelays?: number[];
}
