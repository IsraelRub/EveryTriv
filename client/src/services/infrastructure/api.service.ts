/**
 * Client API service
 * Handles HTTP requests to the server and returns typed DTOs
 * @module ClientApiService
 * @used_by client/src/hooks/api/**, client/src/views/**
 */
import {
	API_ROUTES,
	defaultValidators,
	HTTP_CLIENT_CONFIG,
	HTTP_STATUS_CODES,
	HttpMethod,
	LOCALHOST_CONFIG,
} from '@shared/constants';
import {
	ApiResponse,
	AuthCredentials,
	AuthenticationResult,
	BaseData,
	BasicUser,
	ChangePasswordData,
	ClientLogsRequest,
	RefreshTokenResponse,
	RequestData,
	UpdateUserProfileData,
	UserPreferences,
	UserProfileResponseType,
} from '@shared/types';
import { calculateRetryDelay, getErrorMessage, hasProperty, hasPropertyOfType, isRecord } from '@shared/utils';

import { CLIENT_STORAGE_KEYS } from '@/constants';

import { clientLogger as logger, storageService } from '@/services';

import type { ClientApiService, EnhancedRequestConfig, RequestTransformer, ResponseTransformer } from '@/types';
import type { ApiError, ErrorResponseData, ServerAuthResponse } from '@/types/infrastructure';

import {
	authRequestInterceptor,
	ErrorInterceptorManager,
	RequestInterceptorManager,
	ResponseInterceptorManager,
} from './interceptors';

/**
 * API Configuration Helper
 * @description Simple configuration helper for API URLs
 */
class ApiConfig {
	static getBaseUrl(): string {
		const envUrl = import.meta.env.VITE_API_BASE_URL;
		return envUrl || LOCALHOST_CONFIG.urls.SERVER;
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

	/**
	 * Convert complex data structure to BaseData format
	 * Recursively processes nested objects and arrays, converting them to JSON strings
	 * @param data Data to convert
	 * @returns BaseData object with primitive values and stringified complex types
	 */
	private convertToBaseData(data: unknown): BaseData {
		const result: BaseData = {};

		if (!isRecord(data)) {
			return result;
		}

		for (const [key, value] of Object.entries(data)) {
			if (
				defaultValidators.string(value) ||
				defaultValidators.number(value) ||
				defaultValidators.boolean(value) ||
				value instanceof Date
			) {
				result[key] = value;
			} else if (Array.isArray(value) || isRecord(value)) {
				if (isRecord(value)) {
					const baseDataValue = this.convertToBaseData(value);
					result[key] = JSON.stringify(baseDataValue);
				} else {
					result[key] = JSON.stringify(value);
				}
			}
		}

		return result;
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
	 * @param timeoutMs Timeout in milliseconds
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
	 * @param url Request URL
	 * @param method HTTP method
	 * @param requestId Optional request ID
	 * @returns Unique request key
	 */
	private getRequestKey(url: string, method: HttpMethod, requestId?: string): string {
		return requestId || `${method}:${url}`;
	}

	private buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
		if (!params) {
			return '';
		}

		const searchParams = new URLSearchParams();
		Object.entries(params).forEach(([key, value]) => {
			if (value == null) {
				return;
			}
			searchParams.append(key, String(value));
		});
		const query = searchParams.toString();
		return query ? `?${query}` : '';
	}

	/**
	 * Execute request with all interceptors and features
	 * @param url Request URL
	 * @param method HTTP method
	 * @param config Request configuration
	 * @param data Request body data
	 * @returns API response
	 */
	private async executeRequest<T>(
		url: string,
		method: HttpMethod,
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
	 * @param url Request URL
	 * @param method HTTP method
	 * @param config Request configuration
	 * @param data Request body data
	 * @returns API response
	 */
	private async executeRequestInternal<T>(
		url: string,
		method: HttpMethod,
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

			// Transform request data if provided
			let transformedData: RequestData = data;
			let requestBody: string | undefined;

			// Log initial data state
			logger.apiDebug('Request data received', {
				url,
				method,
				dataKeys: isRecord(data) ? Object.keys(data) : undefined,
			});

			if (data && (method === HttpMethod.POST || method === HttpMethod.PUT || method === HttpMethod.PATCH)) {
				for (const transformer of this.requestTransformers) {
					transformedData = await transformer(transformedData);
				}
				requestBody = JSON.stringify(transformedData);

				// Debug logging for request body (runs in all environments)
				logger.apiDebug('Request body prepared', {
					url,
					method,
					data: {
						originalData: data,
						transformedData,
						bodyString: requestBody,
					},
				});
			} else {
				// Log when body is not prepared
				logger.apiDebug('Request body not prepared', {
					url,
					method,
				});
			}

			// Prepare fetch config - body must be set after spreading interceptedConfig to prevent it from being overwritten
			// Extract body from interceptedConfig if it exists and exclude it from spread to prevent overwriting our body
			// Also exclude other RequestInit properties that might interfere with body
			const {
				body: _ignoredBody,
				method: _ignoredMethod,
				headers: _ignoredHeaders,
				signal: _ignoredSignal,
				...configWithoutRequestInit
			} = interceptedConfig;

			// Build headers separately to ensure Content-Type is set correctly
			const headers = new Headers({
				...HTTP_CLIENT_CONFIG.DEFAULT_HEADERS,
				...interceptedConfig.headers,
			});

			// Ensure Content-Type is set when body is present
			if (requestBody) {
				headers.set('Content-Type', 'application/json');
			}

			// Build fetch config with explicit body handling
			// Ensure cookies are sent with requests (needed for httpOnly cookies from OAuth)
			const fetchConfig: RequestInit = {
				method,
				headers,
				signal: interceptedConfig.signal,
				credentials: 'include',
				// Spread config without RequestInit properties to preserve custom properties only
				...configWithoutRequestInit,
			};

			// Body must be set last and explicitly to prevent it from being overwritten
			// Only set body if we have requestBody to avoid sending undefined/null
			if (requestBody) {
				fetchConfig.body = requestBody;
			}

			// Debug logging for fetch config (runs in all environments)
			if (requestBody) {
				const contentTypeValue =
					fetchConfig.headers && 'Content-Type' in fetchConfig.headers
						? fetchConfig.headers['Content-Type']
						: undefined;
				logger.apiDebug('Fetch config prepared', {
					url,
					method,
					bodyLength: typeof fetchConfig.body === 'string' ? fetchConfig.body.length : 0,
					...(contentTypeValue && { contentType: contentTypeValue }),
				});
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
			let apiResponse = await this.handleResponse<T>(response, method, originalRequestFn);

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
			// Create API error - error is unknown in catch block, but may already contain rich metadata
			const errorMessage = getErrorMessage(error);

			let statusCode: number = 0;
			let details: BaseData = { error: errorMessage };

			if (isRecord(error)) {
				const hasStatusCode = hasPropertyOfType(error, 'statusCode', defaultValidators.number);
				if (hasStatusCode) {
					statusCode = error.statusCode;
				}

				if (hasProperty(error, 'details') && isRecord(error.details)) {
					details = this.convertToBaseData(error.details);
				}
			}

			const apiError: ApiError = {
				message: errorMessage,
				statusCode,
				details,
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
			let statusCode: number = 0;

			if (hasPropertyOfType(error, 'statusCode', defaultValidators.number)) {
				statusCode = error.statusCode;
			}

			const apiError: ApiError = {
				message: errorMessage,
				statusCode,
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
				attempt < this.retryAttempts && (apiErrorWithFlags.isServerError === true || apiError.statusCode === 0);

			if (shouldRetry) {
				// Linear retry delay: baseDelay * attempt (not exponential)
				const delay = calculateRetryDelay(this.retryDelay, attempt - 1, {
					useExponentialBackoff: false,
					jitter: { maxJitter: 1000 },
				});
				await this.sleep(delay);
				return this.retryRequest(requestFn, attempt + 1);
			}

			throw error;
		}
	}

	private async handleResponse<T>(
		response: Response,
		method: HttpMethod,
		originalRequest?: () => Promise<ApiResponse<T>>,
		hasAttemptedRefresh: boolean = false
	): Promise<ApiResponse<T>> {
		if (!response.ok) {
			// Handle 401 Unauthorized - try to refresh token (only once per request)
			if (response.status === 401 && originalRequest && !hasAttemptedRefresh) {
				// Check if we have a refresh token before attempting refresh
				const refreshTokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
				const hasRefreshToken = refreshTokenResult.success && !!refreshTokenResult.data;

				if (hasRefreshToken) {
					try {
						await this.refreshToken();
						// Retry the original request with new token (mark as refresh attempted to prevent infinite loop)
						const retryResponse = await originalRequest();
						// If retry also returns 401, don't try to refresh again
						if (retryResponse.statusCode === 401) {
							// Refresh failed, clear tokens
							await storageService.delete(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
							await storageService.delete(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
							// Throw error - AppRoutes will handle redirect to login
							const sessionExpiredError = new Error('Session expired. Please login again.');
							sessionExpiredError.name = 'SessionExpiredError';
							throw sessionExpiredError;
						}
						return retryResponse;
					} catch (error) {
						// If error is already SessionExpiredError, re-throw it
						if (error instanceof Error && error.name === 'SessionExpiredError') {
							throw error;
						}
						// Refresh failed, clear tokens
						await storageService.delete(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
						await storageService.delete(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
						// Throw error - AppRoutes will handle redirect to login
						const sessionExpiredError = new Error('Session expired. Please login again.');
						sessionExpiredError.name = 'SessionExpiredError';
						throw sessionExpiredError;
					}
				} else {
					// No refresh token available, clear tokens and throw error
					await storageService.delete(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
					await storageService.delete(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
					const sessionExpiredError = new Error('Session expired. Please login again.');
					sessionExpiredError.name = 'SessionExpiredError';
					throw sessionExpiredError;
				}
			}

			let errorData: ErrorResponseData = {};
			let details: BaseData = {};
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
						details = this.convertToBaseData(jsonData);
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
				method: method,
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
		if (hasProperty(responseData, 'success') && hasProperty(responseData, 'data') && isRecord(responseData)) {
			const timestampValue =
				'timestamp' in responseData && typeof responseData.timestamp === 'string'
					? responseData.timestamp
					: new Date().toISOString();
			const apiResponse: ApiResponse<unknown> = {
				data: responseData.data,
				success: Boolean(responseData.success),
				statusCode: response.status,
				timestamp: timestampValue,
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
		return this.executeRequest<T>(url, HttpMethod.GET, config);
	}

	async post<T>(url: string, data?: RequestData, config?: EnhancedRequestConfig): Promise<ApiResponse<T>> {
		return this.executeRequest<T>(url, HttpMethod.POST, config, data);
	}

	async put<T>(url: string, data?: RequestData, config?: EnhancedRequestConfig): Promise<ApiResponse<T>> {
		return this.executeRequest<T>(url, HttpMethod.PUT, config, data);
	}

	async patch<T>(url: string, data?: RequestData, config?: EnhancedRequestConfig): Promise<ApiResponse<T>> {
		return this.executeRequest<T>(url, HttpMethod.PATCH, config, data);
	}

	async delete<T>(url: string, config?: EnhancedRequestConfig): Promise<ApiResponse<T>> {
		return this.executeRequest<T>(url, HttpMethod.DELETE, config);
	}

	// Auth methods
	async login(credentials: AuthCredentials): Promise<AuthenticationResult> {
		const response = await this.post<ServerAuthResponse>(API_ROUTES.AUTH.LOGIN, credentials);

		// Convert server response format (access_token) to client format (accessToken)
		const serverResponse = response.data;
		const authResult: AuthenticationResult = {
			user: serverResponse.user,
			accessToken: serverResponse.access_token,
			refreshToken: serverResponse.refresh_token,
		};

		// Store tokens securely using centralized constants
		if (authResult.accessToken) {
			await storageService.set(CLIENT_STORAGE_KEYS.AUTH_TOKEN, authResult.accessToken);
		}
		if (authResult.refreshToken) {
			await storageService.set(CLIENT_STORAGE_KEYS.REFRESH_TOKEN, authResult.refreshToken);
		}

		return authResult;
	}

	async register(
		credentials: AuthCredentials & { firstName?: string; lastName?: string }
	): Promise<AuthenticationResult> {
		const registerPayload: { email: string; password: string; firstName?: string; lastName?: string } = {
			email: credentials.email,
			password: credentials.password,
		};
		if (credentials.firstName) registerPayload.firstName = credentials.firstName;
		if (credentials.lastName) registerPayload.lastName = credentials.lastName;

		logger.authRegister('Calling register API', {
			email: credentials.email,
		});

		const response = await this.post<ServerAuthResponse>(API_ROUTES.AUTH.REGISTER, registerPayload);

		// Convert server response format (access_token) to client format (accessToken)
		const serverResponse = response.data;
		const authResult: AuthenticationResult = {
			user: serverResponse.user,
			accessToken: serverResponse.access_token,
			refreshToken: serverResponse.refresh_token,
		};

		logger.authRegister('Register API response received', {
			userId: authResult.user?.id,
			email: authResult.user?.email,
		});

		// Store tokens securely using centralized constants
		// Note: Tokens are also stored in authService.setAuthData, but we store them here
		// to ensure they're available immediately for subsequent requests
		if (authResult.accessToken) {
			// Clear any existing token first to prevent conflicts
			await storageService.delete(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
			await storageService.set(CLIENT_STORAGE_KEYS.AUTH_TOKEN, authResult.accessToken);

			// Verify token was stored correctly
			const storedTokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
			const storedToken = storedTokenResult.success ? storedTokenResult.data : null;

			logger.authInfo('Access token stored', {
				valueLength: authResult.accessToken.length,
				userId: authResult.user?.id,
				email: authResult.user?.email,
				tokenMatches: storedToken === authResult.accessToken,
			});
		}
		if (authResult.refreshToken) {
			await storageService.delete(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
			await storageService.set(CLIENT_STORAGE_KEYS.REFRESH_TOKEN, authResult.refreshToken);
			logger.authInfo('Refresh token stored');
		}

		return authResult;
	}

	async logout(): Promise<void> {
		try {
			await this.post(API_ROUTES.AUTH.LOGOUT);
		} catch (error) {
			// Continue with logout even if server request fails
			logger.apiWarn('Logout request failed, but clearing local tokens', { error: getErrorMessage(error) });
		} finally {
			// Always clear local tokens
			await storageService.delete(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
			await storageService.delete(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
		}
	}

	async refreshToken(): Promise<RefreshTokenResponse> {
		const refreshTokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
		const refreshToken = refreshTokenResult.success ? refreshTokenResult.data : null;
		if (!refreshToken) {
			throw new Error('No refresh token available');
		}

		const response = await this.post<{ access_token: string }>(API_ROUTES.AUTH.REFRESH, {
			refreshToken,
		});

		// Convert server response format (access_token) to client format (accessToken)
		const accessToken = response.data.access_token;
		if (accessToken) {
			await storageService.set(CLIENT_STORAGE_KEYS.AUTH_TOKEN, accessToken);
		}

		return { accessToken };
	}

	async getCurrentUser(): Promise<BasicUser> {
		const response = await this.get<BasicUser>(API_ROUTES.AUTH.ME);
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
		const response = await this.get<UserProfileResponseType>(API_ROUTES.USER.PROFILE);
		return response.data;
	}

	async updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileResponseType> {
		// Validate required fields
		if (!data || Object.keys(data).length === 0) {
			throw new Error('Profile data is required');
		}

		const response = await this.put<UserProfileResponseType>(API_ROUTES.USER.PROFILE, data);
		return response.data;
	}

	async setAvatar(avatarId: number): Promise<UserProfileResponseType> {
		// Validate avatar ID
		if (!Number.isInteger(avatarId) || avatarId < 1 || avatarId > 16) {
			throw new Error('Avatar ID must be between 1 and 16');
		}

		const response = await this.patch<UserProfileResponseType>(API_ROUTES.USER.AVATAR, {
			avatarId,
		});
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

		const response = await this.get<BasicUser[]>(`${API_ROUTES.USER.SEARCH}${queryString}`);
		return response.data;
	}

	// User preferences methods
	async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
		const response = await this.put<void>(API_ROUTES.USER.PREFERENCES, preferences);
		return response.data;
	}

	// Account management methods
	async deleteUserAccount(): Promise<string> {
		const response = await this.delete<string>(API_ROUTES.USER.ACCOUNT);
		return response.data;
	}

	async changePassword(changePasswordData: ChangePasswordData): Promise<string> {
		const response = await this.put<string>(API_ROUTES.USER.CHANGE_PASSWORD, changePasswordData);
		return response.data;
	}

	// Submit client logs
	async submitClientLogs(logs: ClientLogsRequest): Promise<string> {
		// Validate logs
		if (!logs || !logs.logs || !Array.isArray(logs.logs) || logs.logs.length === 0) {
			throw new Error('Logs array is required and must not be empty');
		}

		const response = await this.post<string>(API_ROUTES.CLIENT_LOGS.BATCH, logs);
		return response.data;
	}

	/**
	 * Add request transformer
	 * @param transformer Request transformer function
	 */
	addRequestTransformer(transformer: RequestTransformer): void {
		this.requestTransformers.push(transformer);
	}

	/**
	 * Remove request transformer
	 * @param transformer Transformer function to remove
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
	 * @param transformer Response transformer function
	 */
	addResponseTransformer(transformer: ResponseTransformer): void {
		this.responseTransformers.push(transformer);
	}

	/**
	 * Remove response transformer
	 * @param transformer Transformer function to remove
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
