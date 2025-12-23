/**
 * Groq API Client
 * API client for Groq provider with retry logic
 */
import {
	ERROR_CODES,
	ERROR_MESSAGES,
	GROQ_DEFAULT_MODEL,
	GROQ_FREE_TIER_MODELS,
	GROQ_MODELS,
	HTTP_CLIENT_CONFIG,
	HTTP_STATUS_CODES,
	HTTP_TIMEOUTS,
	HttpMethod,
} from '@shared/constants';
import { getErrorMessage, isRecord, RetryService } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';
import type { LLMResponse, ProviderConfig } from '@internal/types';
import { createAuthError, isProviderAuthError } from '@internal/utils';

import { PromptTemplates } from '../prompts';

/**
 * Groq API Client
 * Handles API calls to Groq with retry logic
 */
export class GroqApiClient {
	constructor(
		private readonly apiKey: string,
		private readonly providerName: string = 'Groq',
		private currentModelIndex: number = 0
	) {}

	/**
	 * Select model based on priority
	 * Priority 1 models are free tier models (llama-3.1-8b-instant, gpt-oss-20b)
	 * Uses round-robin selection among priority 1 models if multiple available
	 */
	private selectModel(): string {
		const freeTierModelsLength = GROQ_FREE_TIER_MODELS.length as number;
		if (freeTierModelsLength === 0) {
			return GROQ_DEFAULT_MODEL;
		}

		// Round-robin selection among free tier models
		const selectedModel = GROQ_FREE_TIER_MODELS[this.currentModelIndex % freeTierModelsLength];
		this.currentModelIndex = (this.currentModelIndex + 1) % freeTierModelsLength;

		return selectedModel;
	}

	/**
	 * Get provider configuration for API call
	 */
	getProviderConfig(prompt: string): ProviderConfig {
		const selectedModel = this.selectModel();
		const modelConfig = GROQ_MODELS[selectedModel];

		return {
			name: 'groq',
			apiKey: this.apiKey,
			baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
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
						content: PromptTemplates.getSystemPrompt(),
					},
					{ role: 'user', content: prompt },
				],
				temperature: 0.7,
				max_tokens: 512,
			},
		};
	}

	/**
	 * Make API call with retry logic
	 */
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

		// Use RetryService for unified retry logic
		const result = await RetryService.execute<LLMResponse>(
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
							error: errorText,
						});
					}

					// Handle 401 Unauthorized - don't retry, throw immediately
					if (response.status === HTTP_STATUS_CODES.UNAUTHORIZED) {
						logger.providerError(this.providerName, 'API key authentication failed', {
							status: response.status,
							error: errorText,
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
							retryAfter: retryAfterSeconds,
							provider: this.providerName,
						});
						throw rateLimitError;
					}

					// For other errors, throw with status code
					const error = new Error(errorMessage);
					Object.assign(error, {
						statusCode: response.status,
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
					statusCode: response.status,
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
						error: getErrorMessage(error),
						delay,
					});
				},
				onError: (error, attempt, isFinal) => {
					if (isFinal) {
						logger.providerError(this.providerName, ERROR_MESSAGES.provider.AI_GENERATION_FAILED, {
							error: getErrorMessage(error),
							attempt,
							timeout: config.timeout,
						});
					} else {
						logger.providerStats(this.providerName, {
							eventType: 'api_call_retry',
							error: getErrorMessage(error),
							attempt,
						});
					}
				},
			}
		);

		return result.data;
	}
}
