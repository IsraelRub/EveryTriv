/**
 * Client API service
 * Handles HTTP requests to the server and returns typed DTOs
 * @module ClientApiService
 * @used_by client/src/hooks/api/**, client/src/views/**
 */
import {
	BillingCycle,
	GameMode,
	HTTP_CLIENT_CONFIG,
	HTTP_STATUS_CODES,
	PlanType,
	TimePeriod,
	VALIDATION_LIMITS,
} from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import {
	Achievement,
	ActivityEntry,
	AnalyticsResponse,
	AnswerResult,
	ApiError,
	ApiResponse,
	AuthCredentials,
	AuthenticationResult,
	BaseData,
	BaseValidationResult,
	BasicUser,
	BasicValue,
	CanPlayResponse,
	ClientLogsRequest,
	CompleteUserAnalytics,
	CustomDifficultyRequest,
	DifficultyStatsData,
	ErrorResponseData,
	GameData,
	GameHistoryEntry,
	GlobalStatsResponse,
	LeaderboardEntry,
	LeaderboardStatsResponse,
	PaymentResult,
	PointBalance,
	PointPurchaseOption,
	PointTransaction,
	RequestData,
	SubscriptionData,
	SubscriptionPlans,
	SystemRecommendation,
	TopicStatsData,
	TriviaQuestion,
	TriviaRequest,
	UpdateUserProfileData,
	User,
	UserAnalyticsQuery,
	UserAnalyticsRecord,
	UserComparisonResult,
	UserInsightsData,
	UserPerformanceMetrics,
	UserPreferences,
	UserProfileResponseType,
	UserProgressAnalytics,
	UserRankData,
	UserStatsData,
	UserSummaryData,
	UserTrendPoint,
} from '@shared/types';
import { getErrorMessage, hasProperty, hasPropertyOfType, isRecord } from '@shared/utils';

import { CLIENT_STORAGE_KEYS } from '../constants';
import type {
	ClientApiService,
	EnhancedRequestConfig,
	PointsPurchaseRequest,
	PointsPurchaseResponse,
	RequestTransformer,
	ResponseTransformer,
} from '../types';
import {
	authRequestInterceptor,
	ErrorInterceptorManager,
	RequestInterceptorManager,
	ResponseInterceptorManager,
} from './interceptors';
import { storageService } from './storage.service';

type TrendQueryParams = {
	startDate?: string;
	endDate?: string;
	groupBy?: TimePeriod;
	limit?: number;
};

type ActivityQueryParams = {
	startDate?: string;
	endDate?: string;
	limit?: number;
};

type ComparisonQueryParams = {
	target?: 'global' | 'user';
	targetUserId?: string;
	startDate?: string;
	endDate?: string;
};

/**
 * API Configuration Helper
 * @description Simple configuration helper for API URLs
 */
class ApiConfig {
	static getBaseUrl(): string {
		const envUrl = import.meta.env.VITE_API_BASE_URL;
		return envUrl || 'http://localhost:3001';
	}

	static getGoogleAuthUrl(): string {
		return `${this.getBaseUrl()}/auth/google`;
	}
}

class ApiService implements ClientApiService {
	private baseURL: string;
	private retryAttempts: number = HTTP_CLIENT_CONFIG.RETRY_ATTEMPTS;
	private retryDelay: number = HTTP_CLIENT_CONFIG.RETRY_DELAY;
	private requestInterceptors: RequestInterceptorManager;
	private responseInterceptors: ResponseInterceptorManager;
	private errorInterceptors: ErrorInterceptorManager;
	private requestTransformers: RequestTransformer[] = [];
	private responseTransformers: ResponseTransformer[] = [];
	private activeRequests = new Map<string, Promise<ApiResponse<unknown>>>();

	/**
	 * Type guard to check if response data matches expected type
	 * This is a runtime check that validates the structure
	 */
	private isValidApiResponse<T>(response: ApiResponse<unknown>): response is ApiResponse<T> {
		return hasProperty(response, 'data') && hasProperty(response, 'success');
	}

	private assertQuestionCountWithinLimits(questionCount: number): void {
		const { MIN, MAX } = VALIDATION_LIMITS.QUESTION_COUNT;
		if (!Number.isFinite(questionCount) || questionCount < MIN || questionCount > MAX) {
			throw new Error(`Question count must be between ${MIN} and ${MAX}`);
		}
	}

	constructor() {
		this.baseURL = ApiConfig.getBaseUrl();
		this.requestInterceptors = new RequestInterceptorManager();
		this.responseInterceptors = new ResponseInterceptorManager();
		this.errorInterceptors = new ErrorInterceptorManager();

		// Register auth request interceptor with highest priority (runs first)
		this.requestInterceptors.use(authRequestInterceptor, { priority: 0 });
	}

	private async sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Create timeout abort controller
	 * @param timeoutMs - Timeout in milliseconds
	 * @returns AbortController that will abort after timeout
	 */
	private createTimeoutController(timeoutMs: number): AbortController {
		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, timeoutMs);
		return controller;
	}

	/**
	 * Generate request key for deduplication
	 * @param url - Request URL
	 * @param method - HTTP method
	 * @param requestId - Optional request ID
	 * @returns Unique request key
	 */
	private getRequestKey(url: string, method: string, requestId?: string): string {
		return requestId || `${method}:${url}`;
	}

	private buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
		if (!params) {
			return '';
		}

		const searchParams = new URLSearchParams();
		Object.entries(params).forEach(([key, value]) => {
			if (value === undefined || value === null) {
				return;
			}
			searchParams.append(key, String(value));
		});
		const query = searchParams.toString();
		return query ? `?${query}` : '';
	}

	/**
	 * Execute request with all interceptors and features
	 * @param url - Request URL
	 * @param method - HTTP method
	 * @param config - Request configuration
	 * @param data - Request body data
	 * @returns API response
	 */
	private async executeRequest<T>(
		url: string,
		method: string,
		config: EnhancedRequestConfig = {},
		data?: RequestData
	): Promise<ApiResponse<T>> {
		// Generate request key for deduplication
		const requestKey = this.getRequestKey(url, method, config.requestId);

		// Check for duplicate request (if not skipped)
		if (!config.skipDeduplication && this.activeRequests.has(requestKey)) {
			const existingRequest = this.activeRequests.get(requestKey);
			if (existingRequest) {
				return new Promise<ApiResponse<T>>((resolve, reject) => {
					existingRequest
						.then(response => {
							if (this.isValidApiResponse<T>(response)) {
								resolve(response);
								return;
							}
							reject(new Error('Invalid API response structure'));
						})
						.catch(reject);
				});
			}
		}

		// Create request function with retry logic
		const requestFn = async (): Promise<ApiResponse<T>> => {
			return this.executeRequestInternal<T>(url, method, config, data);
		};

		// Wrap with retry if not skipped
		const requestPromise = config.skipRetry ? requestFn() : this.retryRequest(requestFn);

		// Store active request for deduplication
		if (!config.skipDeduplication) {
			const requestPromiseUnknown: Promise<ApiResponse<unknown>> = requestPromise;
			this.activeRequests.set(requestKey, requestPromiseUnknown);
			requestPromise.finally(() => {
				this.activeRequests.delete(requestKey);
			});
		}

		return requestPromise;
	}

	/**
	 * Internal request execution with interceptors
	 * @param url - Request URL
	 * @param method - HTTP method
	 * @param config - Request configuration
	 * @param data - Request body data
	 * @returns API response
	 */
	private async executeRequestInternal<T>(
		url: string,
		method: string,
		config: EnhancedRequestConfig = {},
		data?: RequestData
	): Promise<ApiResponse<T>> {
		try {
			// Merge timeout with signal
			const timeout = config.timeout ?? HTTP_CLIENT_CONFIG.TIMEOUT;
			const timeoutController = this.createTimeoutController(timeout);

			// Combine signals if both provided (use provided signal as primary, timeout as fallback)
			let signal: AbortSignal = timeoutController.signal;
			if (config.signal) {
				// If provided signal is aborted, use it; otherwise use timeout signal
				// Create a combined controller that aborts when either signal aborts
				const combinedController = new AbortController();
				const abortIfNeeded = () => {
					if (config.signal?.aborted || timeoutController.signal.aborted) {
						combinedController.abort();
					}
				};
				config.signal.addEventListener('abort', abortIfNeeded);
				timeoutController.signal.addEventListener('abort', abortIfNeeded);
				signal = combinedController.signal;
			}

			// Prepare enhanced config
			const enhancedConfig: EnhancedRequestConfig = {
				...config,
				signal,
				baseURL: config.baseURL ?? this.baseURL,
			};

			// Execute request interceptors (auth headers are added by authRequestInterceptor)
			const interceptedConfig = await this.requestInterceptors.execute(enhancedConfig);

			// Prepare fetch config
			const fetchConfig: RequestInit = {
				method,
				headers: {
					...HTTP_CLIENT_CONFIG.DEFAULT_HEADERS,
					...interceptedConfig.headers,
				},
				signal: interceptedConfig.signal,
				...interceptedConfig,
			};

			// Transform request data if provided
			let transformedData: RequestData = data;
			if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
				for (const transformer of this.requestTransformers) {
					transformedData = await transformer(transformedData);
				}
				fetchConfig.body = JSON.stringify(transformedData);
			}

			// Execute fetch
			const fullUrl = `${interceptedConfig.baseURL ?? this.baseURL}${url}`;
			const response = await fetch(fullUrl, fetchConfig);

			// Handle response with retry support for 401
			// Create a function that will retry the full request (including interceptors)
			const originalRequestFn = async (): Promise<ApiResponse<T>> => {
				// Re-execute the full request flow including interceptors
				return this.executeRequestInternal<T>(url, method, config, data);
			};
			let apiResponse = await this.handleResponse<T>(response, originalRequestFn);

			// Transform response data
			if (apiResponse.data && this.responseTransformers.length > 0) {
				let transformedData = apiResponse.data;
				for (const transformer of this.responseTransformers) {
					transformedData = await transformer(transformedData);
				}
				apiResponse = { ...apiResponse, data: transformedData };
			}

			// Execute response interceptors
			const interceptedResponse = await this.responseInterceptors.execute(apiResponse);

			return interceptedResponse;
		} catch (error) {
			// Create API error - error is unknown in catch block
			const errorMessage = getErrorMessage(error);
			const apiError: ApiError = {
				message: errorMessage,
				statusCode: 0,
				details: { error: errorMessage },
			};

			// Execute error interceptors
			const interceptedError = await this.errorInterceptors.execute(apiError);

			throw interceptedError;
		}
	}

	private async retryRequest<T>(
		requestFn: () => Promise<ApiResponse<T>>,
		attempt: number = 1
	): Promise<ApiResponse<T>> {
		try {
			return await requestFn();
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			const apiError: ApiError = {
				message: errorMessage,
				statusCode: 0,
				details: { error: errorMessage },
			};

			// Check if error has isServerError property with boolean type
			const isServerErrorValue: boolean | undefined = hasPropertyOfType(
				error,
				'isServerError',
				(value): value is boolean => typeof value === 'boolean'
			)
				? error.isServerError
				: undefined;
			const apiErrorWithFlags: ApiError & { isServerError?: boolean } = {
				...apiError,
				isServerError: isServerErrorValue,
			};

			const shouldRetry =
				attempt < this.retryAttempts && (apiErrorWithFlags.isServerError || apiError.statusCode === 0);

			if (shouldRetry) {
				const baseDelay = this.retryDelay * attempt;
				const jitter = Math.random() * Math.min(baseDelay * 0.1, 1000);
				await this.sleep(baseDelay + jitter);
				return this.retryRequest(requestFn, attempt + 1);
			}

			throw error;
		}
	}

	private async handleResponse<T>(
		response: Response,
		originalRequest?: () => Promise<ApiResponse<T>>
	): Promise<ApiResponse<T>> {
		if (!response.ok) {
			// Handle 401 Unauthorized - try to refresh token
			if (response.status === 401 && originalRequest) {
				try {
					await this.refreshToken();
					// Retry the original request with new token
					return await originalRequest();
				} catch {
					// Refresh failed, clear tokens and redirect to login
					await storageService.delete(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
					await storageService.delete(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
					// Redirect to login page
					window.location.href = '/login';
					throw new Error('Session expired. Please login again.');
				}
			}

			let errorData: ErrorResponseData = {};
			const details: BaseData = {};
			const contentType = response.headers.get('content-type');

			if (contentType && contentType.includes('application/json')) {
				try {
					const jsonData = await response.json();
					if (isRecord(jsonData)) {
						errorData = {
							message: typeof jsonData.message === 'string' ? jsonData.message : undefined,
							error: typeof jsonData.error === 'string' ? jsonData.error : undefined,
						};
						// Convert full JSON data to BaseData format for details
						for (const [key, value] of Object.entries(jsonData)) {
							if (
								typeof value === 'string' ||
								typeof value === 'number' ||
								typeof value === 'boolean' ||
								value instanceof Date
							) {
								details[key] = value;
							} else if (Array.isArray(value)) {
								details[key] = JSON.stringify(value);
							} else if (isRecord(value)) {
								const baseDataValue: BaseData = {};
								for (const [nestedKey, nestedValue] of Object.entries(value)) {
									if (
										typeof nestedValue === 'string' ||
										typeof nestedValue === 'number' ||
										typeof nestedValue === 'boolean' ||
										nestedValue instanceof Date
									) {
										baseDataValue[nestedKey] = nestedValue;
									} else if (Array.isArray(nestedValue)) {
										baseDataValue[nestedKey] = JSON.stringify(nestedValue);
									} else if (isRecord(nestedValue)) {
										baseDataValue[nestedKey] = JSON.stringify(nestedValue);
									}
								}
								details[key] = JSON.stringify(baseDataValue);
							}
						}
					} else {
						errorData = { message: 'Invalid error response format' };
						details.message = 'Invalid error response format';
					}
				} catch (parseError) {
					errorData = { message: getErrorMessage(parseError) };
					if (errorData.message) {
						details.message = errorData.message;
					}
				}
			} else {
				const textMessage = await response.text().catch(textError => getErrorMessage(textError));
				errorData = { message: textMessage };
				details.message = textMessage;
			}

			const isServerError =
				response.status >= HTTP_STATUS_CODES.SERVER_ERROR_MIN && response.status <= HTTP_STATUS_CODES.SERVER_ERROR_MAX;
			const isClientError =
				response.status >= HTTP_STATUS_CODES.BAD_REQUEST && response.status < HTTP_STATUS_CODES.SERVER_ERROR_MIN;

			// Enhanced error message with more context
			const errorMessage = getErrorMessage(
				errorData.message ?? errorData.error ?? `HTTP ${response.status}: ${response.statusText}`
			);

			const errorResponse: ApiError & {
				isServerError: boolean;
				isClientError: boolean;
				url: string;
				method: string;
			} = {
				message: errorMessage,
				statusCode: response.status,
				details: details,
				isServerError,
				isClientError,
				url: response.url,
				method: 'unknown', // Will be set by the calling method
			};
			throw errorResponse;
		}

		const contentType = response.headers.get('content-type');
		let responseData: unknown;

		if (contentType && contentType.includes('application/json')) {
			responseData = await response.json();
		} else {
			// Handle non-JSON responses
			responseData = await response.text();
		}

		// Handle server response format: { success: true, data: T, timestamp: string }
		if (isRecord(responseData) && hasProperty(responseData, 'success') && hasProperty(responseData, 'data')) {
			const apiResponse: ApiResponse<unknown> = {
				data: responseData.data,
				success: Boolean(responseData.success),
				statusCode: response.status,
				timestamp: typeof responseData.timestamp === 'string' ? responseData.timestamp : new Date().toISOString(),
			};

			if (this.isValidApiResponse<T>(apiResponse)) {
				return apiResponse;
			}

			throw new Error('Invalid API response structure.');
		}

		// Fallback for direct data responses
		const fallbackResponse: ApiResponse<unknown> = {
			data: responseData,
			success: true,
			statusCode: response.status,
		};

		if (this.isValidApiResponse<T>(fallbackResponse)) {
			return fallbackResponse;
		}

		throw new Error('Invalid API fallback response structure.');
	}

	async get<T>(url: string, config?: EnhancedRequestConfig): Promise<ApiResponse<T>> {
		return this.executeRequest<T>(url, 'GET', config);
	}

	async post<T>(url: string, data?: RequestData, config?: EnhancedRequestConfig): Promise<ApiResponse<T>> {
		return this.executeRequest<T>(url, 'POST', config, data);
	}

	async put<T>(url: string, data?: RequestData, config?: EnhancedRequestConfig): Promise<ApiResponse<T>> {
		return this.executeRequest<T>(url, 'PUT', config, data);
	}

	async patch<T>(url: string, data?: RequestData, config?: EnhancedRequestConfig): Promise<ApiResponse<T>> {
		return this.executeRequest<T>(url, 'PATCH', config, data);
	}

	async delete<T>(url: string, config?: EnhancedRequestConfig): Promise<ApiResponse<T>> {
		return this.executeRequest<T>(url, 'DELETE', config);
	}

	// Auth methods
	async login(credentials: AuthCredentials): Promise<AuthenticationResult> {
		const response = await this.post<AuthenticationResult>('/auth/login', credentials);

		// Store tokens securely using centralized constants
		const authResult: AuthenticationResult = response.data;
		if (authResult.accessToken) {
			await storageService.set(CLIENT_STORAGE_KEYS.AUTH_TOKEN, authResult.accessToken);
		}
		if (authResult.refreshToken) {
			await storageService.set(CLIENT_STORAGE_KEYS.REFRESH_TOKEN, authResult.refreshToken);
		}

		return response.data;
	}

	async register(credentials: AuthCredentials): Promise<AuthenticationResult> {
		const response = await this.post<AuthenticationResult>('/auth/register', credentials);

		return response.data;
	}

	async logout(): Promise<void> {
		try {
			await this.post('/auth/logout');
		} catch (error) {
			// Continue with logout even if server request fails
			logger.apiWarn('Logout request failed, but clearing local tokens', { error: getErrorMessage(error) });
		} finally {
			// Always clear local tokens
			await storageService.delete(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
			await storageService.delete(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
		}
	}

	async refreshToken(): Promise<{ accessToken: string }> {
		const refreshTokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
		const refreshToken = refreshTokenResult.success ? refreshTokenResult.data : null;
		if (!refreshToken) {
			throw new Error('No refresh token available');
		}

		const response = await this.post<{ accessToken: string }>('/auth/refresh', { refreshToken });

		// Update stored access token
		if (response.data.accessToken) {
			await storageService.set(CLIENT_STORAGE_KEYS.AUTH_TOKEN, response.data.accessToken);
		}

		return response.data;
	}

	async getCurrentUser(): Promise<BasicUser> {
		const response = await this.get<BasicUser>('/auth/me');
		return response.data;
	}

	async isAuthenticated(): Promise<boolean> {
		const tokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
		return tokenResult.success && !!tokenResult.data;
	}

	async getAuthToken(): Promise<string | null> {
		const tokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
		return tokenResult.success && tokenResult.data ? tokenResult.data : null;
	}

	// User methods
	async getUserProfile(): Promise<UserProfileResponseType> {
		const response = await this.get<UserProfileResponseType>('/users/profile');
		return response.data;
	}

	async updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileResponseType> {
		// Validate required fields
		if (!data || Object.keys(data).length === 0) {
			throw new Error('Profile data is required');
		}

		const response = await this.put<UserProfileResponseType>('/users/profile', data);
		return response.data;
	}

	async getUserCredits(): Promise<number> {
		const response = await this.get<number>('/users/credits');
		return response.data;
	}

	async deductCredits(amount: number): Promise<{ success: boolean; credits: number }> {
		if (amount <= 0) {
			throw new Error('Amount must be greater than 0');
		}

		const response = await this.post<{ success: boolean; credits: number }>('/users/credits', { amount });
		return response.data;
	}

	// Game methods
	async saveGameHistory(data: GameData): Promise<void> {
		// Validate game history data
		if (!data || !data.userId || data.score == null) {
			throw new Error('Game history data is incomplete');
		}

		const response = await this.post<void>('/game/history', data);
		return response.data;
	}

	async getUserGameHistory(limit?: number, offset?: number): Promise<GameHistoryEntry[]> {
		// Validate pagination parameters
		if (limit && (limit < 1 || limit > 1000)) {
			throw new Error('Limit must be between 1 and 1000');
		}
		if (offset && offset < 0) {
			throw new Error('Offset must be non-negative');
		}

		const query = this.buildQueryString({
			limit,
			offset,
		});

		const response = await this.get<GameHistoryEntry[]>(`/game/history${query}`);
		return response.data;
	}

	async getLeaderboardEntries(limit?: number): Promise<LeaderboardEntry[]> {
		const query = this.buildQueryString({
			limit,
		});

		const response = await this.get<LeaderboardEntry[]>(`/leaderboard/global${query}`);
		return response.data;
	}

	async getUserRank(): Promise<UserRankData> {
		const response = await this.get<UserRankData>('/leaderboard/user/ranking');
		return response.data;
	}

	async getUserStats(): Promise<UserStatsData> {
		// Use analytics instead of separate stats endpoint
		const response = await this.get<CompleteUserAnalytics>('/analytics/user/');

		// Convert CompleteUserAnalytics to UserStatsData format
		const analytics = response.data;
		return {
			userId: analytics.basic.userId,
			totalQuestions: analytics.game.totalQuestions,
			correctAnswers: analytics.game.correctAnswers,
			successRate: analytics.game.successRate,
			favoriteTopic: '', // Not available in UserGameAnalytics
			totalPlayTime: analytics.game.totalPlayTime ?? 0,
			totalGames: analytics.game.totalGames,
			gamesPlayed: analytics.game.totalGames,
			score: analytics.basic.totalPoints,
			averageScore: analytics.game.averageScore,
			bestScore: analytics.game.bestScore,
			currentStreak: analytics.performance.streakDays,
			bestStreak: analytics.performance.bestStreak,
		};
	}

	/**
	 * Update user ranking
	 */
	async updateUserRanking(): Promise<UserRankData> {
		const response = await this.post<UserRankData>('/leaderboard/user/update');
		return response.data;
	}

	/**
	 * Get leaderboard by period (weekly/monthly)
	 */
	async getLeaderboardByPeriod(
		period: 'weekly' | 'monthly',
		limit?: number,
		offset?: number
	): Promise<LeaderboardEntry[]> {
		// Validate pagination parameters
		if (limit && (limit < 1 || limit > 1000)) {
			throw new Error('Limit must be between 1 and 1000');
		}
		if (offset && offset < 0) {
			throw new Error('Offset must be non-negative');
		}

		const query = this.buildQueryString({
			limit,
			offset,
		});

		const response = await this.get<LeaderboardEntry[]>(`/leaderboard/period/${period}${query}`);
		return response.data;
	}

	/**
	 * Get leaderboard statistics for a specific period
	 */
	async getLeaderboardStats(period: 'weekly' | 'monthly' | 'yearly'): Promise<LeaderboardStatsResponse> {
		// Validate period
		if (!['weekly', 'monthly', 'yearly'].includes(period)) {
			throw new Error('Period must be weekly, monthly, or yearly');
		}

		const query = this.buildQueryString({
			period,
		});

		const response = await this.get<LeaderboardStatsResponse>(`/leaderboard/stats${query}`);
		return response.data;
	}

	/**
	 * Search users
	 */
	async searchUsers(query: string, limit: number = 10): Promise<BasicUser[]> {
		// Validate input
		if (!query || query.trim().length === 0) {
			throw new Error('Search query is required');
		}
		if (limit < 1 || limit > 100) {
			throw new Error('Limit must be between 1 and 100');
		}

		const queryString = this.buildQueryString({
			query,
			limit,
		});

		const response = await this.get<BasicUser[]>(`/users/search${queryString}`);
		return response.data;
	}

	/**
	 * Get user by username
	 */
	async getUserByUsername(username: string): Promise<BasicUser> {
		// Validate username
		if (!username || username.trim().length === 0) {
			throw new Error('Username is required');
		}

		const response = await this.get<BasicUser>(`/users/username/${username}`);
		return response.data;
	}

	// Points methods
	async getPointBalance(): Promise<PointBalance> {
		const response = await this.get<PointBalance>('/points/balance');
		return response.data;
	}

	async getPointPackages(): Promise<PointPurchaseOption[]> {
		const response = await this.get<PointPurchaseOption[]>('/points/packages');
		return response.data;
	}

	async canPlay(questionCount: number): Promise<CanPlayResponse> {
		// Validate question count
		this.assertQuestionCountWithinLimits(questionCount);

		const query = this.buildQueryString({
			questionCount,
		});

		const response = await this.get<CanPlayResponse>(`/points/can-play${query}`);
		return response.data;
	}

	async getPointHistory(limit?: number): Promise<PointTransaction[]> {
		const query = this.buildQueryString({
			limit,
		});

		const response = await this.get<PointTransaction[]>(`/points/history${query}`);
		return response.data;
	}

	async confirmPointPurchase(paymentIntentId: string): Promise<PointBalance> {
		const response = await this.post<PointBalance>('/points/confirm-purchase', { paymentIntentId });
		return response.data;
	}

	async createSubscription(plan: PlanType, billingCycle?: BillingCycle): Promise<SubscriptionData> {
		const response = await this.post<SubscriptionData>('/subscription/create', {
			plan,
			billingCycle: billingCycle ?? '',
		});
		return response.data;
	}

	async cancelSubscription(): Promise<{ success: boolean; message: string }> {
		const response = await this.delete<{ success: boolean; message: string }>('/subscription/cancel');
		return response.data;
	}

	// Trivia methods
	async getTrivia(request: TriviaRequest): Promise<TriviaQuestion> {
		// Validate trivia request
		if (!request || !request.topic.trim() || !request.difficulty.trim()) {
			throw new Error('Trivia request is incomplete');
		}
		if (request.questionCount !== undefined) {
			this.assertQuestionCountWithinLimits(Number(request.questionCount));
		}

		const response = await this.post<TriviaQuestion>('/game/trivia', request);
		return response.data;
	}

	/**
	 * Submit answer to a trivia question
	 */
	async submitAnswer(questionId: string, answer: string, timeSpent: number = 0): Promise<AnswerResult> {
		// Validate input
		if (!questionId || questionId.trim().length === 0) {
			throw new Error('Question ID is required');
		}
		if (!answer || answer.trim().length === 0) {
			throw new Error('Answer is required');
		}
		if (timeSpent < 0) {
			throw new Error('Time spent must be non-negative');
		}

		const response = await this.post<AnswerResult>('/game/answer', {
			questionId,
			answer,
			timeSpent,
		});
		return response.data;
	}

	/**
	 * Get trivia question by ID
	 */
	async getTriviaQuestionById(questionId: string): Promise<TriviaQuestion> {
		// Validate question ID
		if (!questionId || questionId.trim().length === 0) {
			throw new Error('Question ID is required');
		}

		const response = await this.get<TriviaQuestion>(`/game/trivia/${questionId}`);
		return response.data;
	}

	/**
	 * Get game by ID
	 */
	async getGameById(gameId: string): Promise<GameHistoryEntry> {
		// Validate game ID
		if (!gameId || gameId.trim().length === 0) {
			throw new Error('Game ID is required');
		}

		const response = await this.get<GameHistoryEntry>(`/game/${gameId}`);
		return response.data;
	}

	async validateCustomDifficulty(customText: string): Promise<BaseValidationResult> {
		// Validate input
		if (!customText || customText.trim().length === 0) {
			throw new Error('Custom difficulty text is required');
		}
		if (customText.length > 500) {
			throw new Error('Custom difficulty text is too long (max 500 characters)');
		}

		const request: CustomDifficultyRequest = { customText };
		const response = await this.post<BaseValidationResult>('/game/validate-custom', request);
		return response.data;
	}

	// User preferences methods
	async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
		const response = await this.put<void>('/users/preferences', preferences);
		return response.data;
	}

	// Account management methods
	async deleteUserAccount(): Promise<{ success: boolean; message: string }> {
		const response = await this.delete<{ success: boolean; message: string }>('/users/account');
		return response.data;
	}

	async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
		const response = await this.put<{ message: string }>('/users/change-password', {
			currentPassword,
			newPassword,
		});
		return response.data;
	}

	// Analytics dashboard methods
	async getUserStatisticsById(userId: string): Promise<AnalyticsResponse<UserAnalyticsRecord>> {
		const response = await this.get<AnalyticsResponse<UserAnalyticsRecord>>(`/analytics/user-stats/${userId}`);
		return response.data;
	}

	async getUserPerformanceById(userId: string): Promise<AnalyticsResponse<UserPerformanceMetrics>> {
		const response = await this.get<AnalyticsResponse<UserPerformanceMetrics>>(`/analytics/user-performance/${userId}`);
		return response.data;
	}

	async getUserProgressById(
		userId: string,
		params?: TrendQueryParams
	): Promise<AnalyticsResponse<UserProgressAnalytics>> {
		const query = this.buildQueryString({
			startDate: params?.startDate,
			endDate: params?.endDate,
			groupBy: params?.groupBy,
			limit: params?.limit,
		});
		const response = await this.get<AnalyticsResponse<UserProgressAnalytics>>(
			`/analytics/user-progress/${userId}${query}`
		);
		return response.data;
	}

	async getUserActivityById(userId: string, params?: ActivityQueryParams): Promise<AnalyticsResponse<ActivityEntry[]>> {
		const query = this.buildQueryString({
			startDate: params?.startDate,
			endDate: params?.endDate,
			limit: params?.limit,
		});
		const response = await this.get<AnalyticsResponse<ActivityEntry[]>>(`/analytics/user-activity/${userId}${query}`);
		return response.data;
	}

	async getUserInsightsById(userId: string): Promise<AnalyticsResponse<UserInsightsData>> {
		const response = await this.get<AnalyticsResponse<UserInsightsData>>(`/analytics/user-insights/${userId}`);
		return response.data;
	}

	async getUserRecommendationsById(userId: string): Promise<AnalyticsResponse<SystemRecommendation[]>> {
		const response = await this.get<AnalyticsResponse<SystemRecommendation[]>>(
			`/analytics/user-recommendations/${userId}`
		);
		return response.data;
	}

	async getUserAchievementsById(userId: string): Promise<AnalyticsResponse<Achievement[]>> {
		const response = await this.get<AnalyticsResponse<Achievement[]>>(`/analytics/user-achievements/${userId}`);
		return response.data;
	}

	async getUserTrendsById(userId: string, params?: TrendQueryParams): Promise<AnalyticsResponse<UserTrendPoint[]>> {
		const query = this.buildQueryString({
			startDate: params?.startDate,
			endDate: params?.endDate,
			groupBy: params?.groupBy,
			limit: params?.limit,
		});
		const response = await this.get<AnalyticsResponse<UserTrendPoint[]>>(`/analytics/user-trends/${userId}${query}`);
		return response.data;
	}

	async compareUserPerformanceById(
		userId: string,
		params?: ComparisonQueryParams
	): Promise<AnalyticsResponse<UserComparisonResult>> {
		const query = this.buildQueryString({
			target: params?.target,
			targetUserId: params?.targetUserId,
			startDate: params?.startDate,
			endDate: params?.endDate,
		});
		const response = await this.get<AnalyticsResponse<UserComparisonResult>>(
			`/analytics/user-comparison/${userId}${query}`
		);
		return response.data;
	}

	async getUserSummaryById(
		userId: string,
		includeActivity: boolean = false
	): Promise<AnalyticsResponse<UserSummaryData>> {
		const query = this.buildQueryString({
			includeActivity,
		});
		const response = await this.get<AnalyticsResponse<UserSummaryData>>(`/analytics/user-summary/${userId}${query}`);
		return response.data;
	}

	async getUserAnalytics(): Promise<CompleteUserAnalytics> {
		const response = await this.get<CompleteUserAnalytics>('/analytics/user/');
		return response.data;
	}

	async getPopularTopics(query?: UserAnalyticsQuery): Promise<TopicStatsData> {
		const queryString = this.buildQueryString({
			startDate: query?.startDate,
			endDate: query?.endDate,
			includeGameHistory: query?.includeGameHistory,
			includePerformance: query?.includePerformance,
			includeTopicBreakdown: query?.includeTopicBreakdown,
		});

		const response = await this.get<TopicStatsData>(`/analytics/topics/popular${queryString}`);
		return response.data;
	}

	async getDifficultyStats(query?: UserAnalyticsQuery): Promise<DifficultyStatsData> {
		const queryString = this.buildQueryString({
			startDate: query?.startDate,
			endDate: query?.endDate,
			includeGameHistory: query?.includeGameHistory,
			includePerformance: query?.includePerformance,
			includeTopicBreakdown: query?.includeTopicBreakdown,
		});

		const response = await this.get<DifficultyStatsData>(`/analytics/difficulty/stats${queryString}`);
		return response.data;
	}

	/**
	 * Get global statistics for comparison
	 */
	async getGlobalStats(): Promise<GlobalStatsResponse> {
		const response = await this.get<GlobalStatsResponse>('/analytics/global-stats');
		return response.data;
	}

	/**
	 * Track analytics event
	 */
	async trackAnalyticsEvent(eventData: {
		eventType: string;
		userId?: string;
		sessionId?: string;
		timestamp?: Date | string;
		page?: string;
		action?: string;
		result?: 'success' | 'failure' | 'error';
		duration?: number;
		value?: number;
		properties?: Record<string, BasicValue>;
	}): Promise<{ tracked: boolean }> {
		// Validate event data
		if (!eventData || !eventData.eventType || eventData.eventType.trim().length === 0) {
			throw new Error('Event type is required');
		}

		const response = await this.post<{ tracked: boolean }>('/analytics/track', eventData);
		return response.data;
	}

	/**
	 * Create payment
	 */
	async createPayment(paymentData: {
		amount?: number;
		currency?: string;
		description?: string;
		planType?: PlanType;
		numberOfPayments?: number;
		paymentMethod: string;
		cardNumber?: string;
		expiryDate?: string;
		cvv?: string;
		cardHolderName?: string;
		postalCode?: string;
		paypalOrderId?: string;
		paypalPaymentId?: string;
		agreeToTerms?: boolean;
		additionalInfo?: string;
	}): Promise<PaymentResult> {
		// Validate payment data
		if (!paymentData.paymentMethod) {
			throw new Error('Payment method is required');
		}

		const response = await this.post<PaymentResult>('/payment/create', paymentData);
		return response.data;
	}

	/**
	 * Get payment history
	 */
	async getPaymentHistory(): Promise<PaymentResult[]> {
		const response = await this.get<PaymentResult[]>('/payment/history');
		return response.data;
	}

	/**
	 * Get subscription plans
	 */
	async getSubscriptionPlans(): Promise<SubscriptionPlans> {
		const response = await this.get<SubscriptionPlans>('/subscription/plans');
		return response.data;
	}

	/**
	 * Get current subscription
	 */
	async getCurrentSubscription(): Promise<SubscriptionData | null> {
		const response = await this.get<SubscriptionData | null>('/subscription/current');
		return response.data;
	}

	/**
	 * Submit client logs
	 */
	async submitClientLogs(logs: ClientLogsRequest): Promise<{ success: boolean; message?: string }> {
		// Validate logs
		if (!logs || !logs.logs || !Array.isArray(logs.logs) || logs.logs.length === 0) {
			throw new Error('Logs array is required and must not be empty');
		}

		const response = await this.post<{ success: boolean; message?: string }>('/client-logs/batch', logs);
		return response.data;
	}

	// New endpoints for game history management
	async deleteGameHistory(gameId: string): Promise<{ success: boolean; message: string }> {
		// Validate game ID
		if (!gameId || gameId.trim().length === 0) {
			throw new Error('Game ID is required');
		}

		const response = await this.delete<{ success: boolean; message: string }>(`/game/history/${gameId}`);
		return response.data;
	}

	async clearGameHistory(): Promise<{ success: boolean; message: string; deletedCount: number }> {
		const response = await this.delete<{ success: boolean; message: string; deletedCount: number }>('/game/history');
		return response.data;
	}

	// New endpoints for user management
	async updateUserField(field: string, value: BasicValue): Promise<{ user: User }> {
		// Validate field and value
		if (!field || field.trim().length === 0) {
			throw new Error('Field name is required');
		}
		if (!value) {
			throw new Error('Value is required');
		}

		const response = await this.patch<{ user: User }>(`/users/profile/${field}`, { value });
		return response.data;
	}

	async updateSinglePreference(preference: string, value: BasicValue): Promise<unknown> {
		// Validate preference and value
		if (!preference || preference.trim().length === 0) {
			throw new Error('Preference name is required');
		}
		if (!value) {
			throw new Error('Value is required');
		}

		return this.patch(`/users/preferences/${preference}`, { value });
	}

	async getUserById(userId: string): Promise<unknown> {
		// Validate user ID
		if (!userId || userId.trim().length === 0) {
			throw new Error('User ID is required');
		}

		return this.get(`/users/${userId}`);
	}

	async updateUserCredits(userId: string, amount: number, reason: string): Promise<unknown> {
		// Validate parameters
		if (!userId || userId.trim().length === 0) {
			throw new Error('User ID is required');
		}
		if (amount === 0) {
			throw new Error('Amount cannot be zero');
		}
		if (!reason || reason.trim().length === 0) {
			throw new Error('Reason is required');
		}

		return this.put(`/users/credits/${userId}`, { amount, reason });
	}

	/**
	 * Deduct points for game play
	 */
	async deductPoints(questionCount: number, gameMode: GameMode): Promise<PointBalance> {
		// Validate parameters
		if (questionCount <= 0) {
			throw new Error('Question count must be greater than 0');
		}
		if (!gameMode || gameMode.trim().length === 0) {
			throw new Error('Game mode is required');
		}

		const response = await this.post<PointBalance>('/points/deduct', { questionCount, gameMode });
		return response.data;
	}

	/**
	 * Purchase points package
	 */
	async purchasePoints(request: PointsPurchaseRequest): Promise<PointsPurchaseResponse> {
		const { packageId, paymentMethod } = request;

		if (!packageId || packageId.trim().length === 0) {
			throw new Error('Package ID is required');
		}

		if (!paymentMethod) {
			throw new Error('Payment method is required');
		}

		const response = await this.post<PointsPurchaseResponse>('/points/purchase', request);
		return response.data;
	}

	/**
	 * Delete user account
	 */
	async deleteUser(userId: string): Promise<unknown> {
		// Validate user ID
		if (!userId || userId.trim().length === 0) {
			throw new Error('User ID is required');
		}

		const response = await this.delete<unknown>(`/users/${userId}`);
		return response.data;
	}

	/**
	 * Update user status
	 */
	async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned'): Promise<unknown> {
		// Validate parameters
		if (!userId || userId.trim().length === 0) {
			throw new Error('User ID is required');
		}
		if (!['active', 'suspended', 'banned'].includes(status)) {
			throw new Error('Status must be active, suspended, or banned');
		}

		const response = await this.patch<unknown>(`/users/${userId}/status`, { status });
		return response.data;
	}

	/**
	 * Add request transformer
	 * @param transformer - Request transformer function
	 */
	addRequestTransformer(transformer: RequestTransformer): void {
		this.requestTransformers.push(transformer);
	}

	/**
	 * Remove request transformer
	 * @param transformer - Transformer function to remove
	 */
	removeRequestTransformer(transformer: RequestTransformer): void {
		const index = this.requestTransformers.indexOf(transformer);
		if (index !== -1) {
			this.requestTransformers.splice(index, 1);
		}
	}

	/**
	 * Clear all request transformers
	 */
	clearRequestTransformers(): void {
		this.requestTransformers = [];
	}

	/**
	 * Add response transformer
	 * @param transformer - Response transformer function
	 */
	addResponseTransformer(transformer: ResponseTransformer): void {
		this.responseTransformers.push(transformer);
	}

	/**
	 * Remove response transformer
	 * @param transformer - Transformer function to remove
	 */
	removeResponseTransformer(transformer: ResponseTransformer): void {
		const index = this.responseTransformers.indexOf(transformer);
		if (index !== -1) {
			this.responseTransformers.splice(index, 1);
		}
	}

	/**
	 * Clear all response transformers
	 */
	clearResponseTransformers(): void {
		this.responseTransformers = [];
	}
}

export { ApiConfig };
export const apiService = new ApiService();
