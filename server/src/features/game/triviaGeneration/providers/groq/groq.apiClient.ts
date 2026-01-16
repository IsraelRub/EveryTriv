import {
	ERROR_CODES,
	ERROR_MESSAGES,
	GROQ_API_BASE_URL,
	GROQ_DEFAULT_MAX_TOKENS,
	GROQ_DEFAULT_TEMPERATURE,
	GROQ_FREE_TIER_MODELS,
	GROQ_MODELS,
	GROQ_PROVIDER_NAME,
	GROQ_PROVIDER_NAME_LOWERCASE,
	HTTP_CLIENT_CONFIG,
	HTTP_STATUS_CODES,
	HTTP_TIMEOUTS,
	HttpMethod,
} from '@shared/constants';
import { executeRetry, getErrorMessage, isProviderAuthError, isRecord } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';
import type { LLMResponse, ProviderConfig } from '@internal/types';
import { createAuthError } from '@internal/utils';

import { SYSTEM_PROMPT } from '../prompts';

export class GroqApiClient {
	constructor(
		private readonly apiKey: string,
		private readonly providerName: string = GROQ_PROVIDER_NAME,
		private currentModelIndex: number = 0
	) {}

	private selectModel(): string {
		const freeTierModelsLength = GROQ_FREE_TIER_MODELS.length;
		// GROQ_FREE_TIER_MODELS always has at least 2 models, so we can safely use it
		// Round-robin selection among free tier models
		const selectedModel = GROQ_FREE_TIER_MODELS[this.currentModelIndex % freeTierModelsLength];
		this.currentModelIndex = (this.currentModelIndex + 1) % freeTierModelsLength;

		if (selectedModel == null) {
			throw new Error('No model available from GROQ_FREE_TIER_MODELS');
		}

		return selectedModel;
	}

	getProviderConfig(prompt: string): ProviderConfig {
		const selectedModel = this.selectModel();
		const modelConfig = GROQ_MODELS[selectedModel];

		return {
			name: GROQ_PROVIDER_NAME_LOWERCASE,
			apiKey: this.apiKey,
			baseUrl: GROQ_API_BASE_URL,
			timeout: HTTP_TIMEOUTS.AI_PROVIDER,
			maxRetries: HTTP_CLIENT_CONFIG.RETRY_ATTEMPTS,
			enabled: true,
			priority: modelConfig?.priority ?? 1,
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: {
				model: selectedModel,
				messages: [
					{
						role: 'system',
						content: SYSTEM_PROMPT,
					},
					{ role: 'user', content: prompt },
				],
				temperature: GROQ_DEFAULT_TEMPERATURE,
				max_tokens: GROQ_DEFAULT_MAX_TOKENS,
			},
		};
	}

	async makeApiCall(prompt: string): Promise<LLMResponse> {
		if (!this.apiKey) {
			throw createAuthError(ERROR_CODES.API_KEY_NOT_CONFIGURED);
		}

		const config = this.getProviderConfig(prompt);

		// Log initial request with detailed info (redact sensitive data)
		const sanitizedBody = config.body ? { ...config.body } : {};
		if ('messages' in sanitizedBody && Array.isArray(sanitizedBody.messages)) {
			sanitizedBody.messages = sanitizedBody.messages.map((msg: { role?: string; content?: unknown }) => ({
				role: msg.role,
				content: typeof msg.content === 'string' ? `${msg.content.substring(0, 100)}...` : '[content]',
			}));
		}

		const modelValue =
			config.body && isRecord(config.body) && 'model' in config.body && typeof config.body.model === 'string'
				? config.body.model
				: undefined;

		logger.providerStats(this.providerName, {
			eventType: 'api_call_start',
			baseUrl: config.baseUrl.replace(config.apiKey || '', '[REDACTED]'),
			timeout: config.timeout,
			maxRetries: config.maxRetries,
			...(modelValue ? { model: modelValue } : {}),
		});

		// Use executeRetry for unified retry logic
		const result = await executeRetry<LLMResponse>(
			async () => {
				const response = await globalThis.fetch(config.baseUrl, {
					method: HttpMethod.POST,
					headers: config.headers ?? {},
					body: JSON.stringify(config.body),
				});

				// Handle non-OK responses
				if (!response.ok) {
					const errorText = await response.text().catch(() => ERROR_MESSAGES.general.UNKNOWN_ERROR);
					const errorMessage = `${this.providerName} API returned ${response.status} ${response.statusText}: ${errorText}`;

					// Log detailed error info for debugging
					if (response.status === HTTP_STATUS_CODES.BAD_REQUEST) {
						logger.providerError(this.providerName, 'Detailed 400 error for debugging', {
							status: response.status,
							errorInfo: { message: errorText },
						});
					}

					// Handle 401 Unauthorized - don't retry, throw immediately
					if (response.status === HTTP_STATUS_CODES.UNAUTHORIZED) {
						logger.providerError(this.providerName, 'API key authentication failed', {
							status: response.status,
							errorInfo: { message: errorText },
						});
						const authError = new Error(errorMessage);
						Object.assign(authError, {
							statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
							isAuthError: true,
							provider: this.providerName,
						});
						throw authError;
					}

					// Handle 429 Rate Limit - extract Retry-After header
					if (response.status === HTTP_STATUS_CODES.TOO_MANY_REQUESTS) {
						const retryAfterHeader = response.headers.get('Retry-After');
						let retryAfterSeconds: number | undefined;
						if (retryAfterHeader) {
							const parsed = parseInt(retryAfterHeader, 10);
							if (!isNaN(parsed) && parsed > 0) {
								retryAfterSeconds = parsed;
								logger.providerStats(this.providerName, {
									eventType: 'rate_limit_detected',
									retryAfterSeconds,
								});
							}
						} else {
							logger.providerStats(this.providerName, {
								eventType: 'rate_limit_detected_no_header',
							});
						}

						const rateLimitError = new Error(errorMessage);
						Object.assign(rateLimitError, {
							statusCode: HTTP_STATUS_CODES.TOO_MANY_REQUESTS,
							isRateLimitError: true,
							responseHeaders: response.headers, // Pass headers for Retry-After extraction
							provider: this.providerName,
						});
						throw rateLimitError;
					}

					// For other errors, throw with status code and headers
					const error = new Error(errorMessage);
					Object.assign(error, {
						statusCode: response.status,
						responseHeaders: response.headers, // Pass headers for potential Retry-After extraction
					});
					throw error;
				}

				// Parse response JSON
				const responseData = await response.json();

				// Convert to LLMResponse format
				const llmResponse: LLMResponse = {
					content: '',
					data: responseData,
					metadata: {
						provider: this.providerName,
						statusCode: response.status,
					},
				};

				logger.providerStats(this.providerName, {
					eventType: 'api_call_success',
					httpStatus: {
						code: response.status,
					},
				});

				return llmResponse;
			},
			{
				maxRetries: config.maxRetries,
				baseDelay: HTTP_CLIENT_CONFIG.RETRY_DELAY,
				timeout: config.timeout,
				retryOnAuthError: false, // Don't retry on 401
				retryOnRateLimit: true, // Retry on 429
				retryOnServerError: true, // Retry on 5xx
				retryOnNetworkError: true, // Retry on network errors
				shouldRetry: error => {
					// Don't retry on auth errors
					if (isProviderAuthError(error)) {
						return false;
					}
					// Retry on rate limit, server errors, and network errors
					return true;
				},
				onRetry: (attempt, error, delay) => {
					logger.providerStats(this.providerName, {
						eventType: attempt === 1 ? 'retry_attempt' : 'rate_limit_retry',
						attempt,
						errorInfo: { message: getErrorMessage(error) },
						delay,
					});
				},
				onError: (error, attempt, isFinal) => {
					if (!isFinal) {
						logger.providerStats(this.providerName, {
							eventType: 'api_call_retry',
							errorInfo: { message: getErrorMessage(error) },
							attempt,
						});
					}
				},
			}
		);

		return result.data;
	}
}
