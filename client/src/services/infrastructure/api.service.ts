import {
	API_ENDPOINTS,
	ERROR_CODES,
	ERROR_MESSAGES,
	HTTP_CLIENT_CONFIG,
	HTTP_STATUS_CODES,
	HttpMethod,
	VALIDATORS,
} from '@shared/constants';
import type {
	ApiError,
	ApiResponse,
	AuthCredentials,
	AuthenticationResult,
	BaseData,
	BasicUser,
	BasicValue,
	ChangePasswordData,
	ErrorResponseData,
	RefreshTokenResponse,
	RequestData,
	UpdateUserProfileData,
	UserPreferences,
	UserProfileResponseType,
} from '@shared/types';
import {
	getErrorMessage,
	hasProperty,
	hasPropertyOfType,
	isNonEmptyString,
	isRecord,
	parseErrorResponseData,
} from '@shared/utils';

import { STORAGE_KEYS, VALIDATION_MESSAGES } from '@/constants';
import { clientLogger as logger, storageService } from '@/services';
import type { AuthResponse, EnhancedRequestConfig } from '@/types';
import { LOCALHOST_CONFIG } from '@/config/localhost.config';
import { authRequestInterceptor, InterceptorsService } from './interceptors.service';

export class ApiConfig {
	static getBaseUrl(): string {
		const envUrl = import.meta.env.VITE_API_BASE_URL;
		return envUrl ?? LOCALHOST_CONFIG.urls.SERVER;
	}
}

class ApiService {
	private baseURL: string;
	private readonly interceptors: InterceptorsService;
	private activeRequests = new Map<string, Promise<ApiResponse<unknown>>>();

	private isValidApiResponse<T>(response: ApiResponse<unknown>): response is ApiResponse<T> {
		return hasProperty(response, 'data') && hasProperty(response, 'success');
	}

	private convertToBaseData(data: unknown): BaseData {
		const result: BaseData = {};

		if (!isRecord(data)) {
			return result;
		}

		for (const [key, value] of Object.entries(data)) {
			if (VALIDATORS.string(value) || VALIDATORS.number(value) || VALIDATORS.boolean(value) || value instanceof Date) {
				result[key] = value;
			} else if (Array.isArray(value)) {
				result[key] = JSON.stringify(value);
			} else if (isRecord(value)) {
				const baseDataValue = this.convertToBaseData(value);
				result[key] = JSON.stringify(baseDataValue);
			}
		}

		return result;
	}

	constructor() {
		this.baseURL = ApiConfig.getBaseUrl();
		this.interceptors = new InterceptorsService();

		// Register auth request interceptor
		this.interceptors.useRequest(authRequestInterceptor);
	}

	private createTimeoutController(timeoutMs: number): AbortController {
		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, timeoutMs);
		return controller;
	}

	private getRequestKey(url: string, method: HttpMethod, requestId?: string): string {
		return requestId ?? `${method}:${url}`;
	}

	private buildQueryString(params?: Record<string, BasicValue>): string {
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
							reject(new Error(ERROR_MESSAGES.api.INVALID_API_RESPONSE_STRUCTURE));
						})
						.catch(reject);
				});
			}
		}

		// Execute request directly (retry logic is handled by QueryClient)
		const requestPromise = this.executeRequestInternal<T>(url, method, config, data, false);

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

	private async executeRequestInternal<T>(
		url: string,
		method: HttpMethod,
		config: EnhancedRequestConfig = {},
		data?: RequestData,
		hasAttemptedRefresh: boolean = false
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
					if (config.signal?.aborted ?? timeoutController.signal.aborted) {
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
			const interceptedConfig = await this.interceptors.executeRequest(enhancedConfig);

			// Prepare request body if provided
			let requestBody: string | undefined;

			// Log initial data state
			logger.apiDebug('Request data received', {
				url,
				method,
				dataKeys: isRecord(data) ? Object.keys(data) : undefined,
			});

			if (data && (method === HttpMethod.POST || method === HttpMethod.PUT || method === HttpMethod.PATCH)) {
				requestBody = JSON.stringify(data);

				// Debug logging for request body (runs in all environments)
				logger.apiDebug('Request body prepared', {
					url,
					method,
					data: {
						originalData: data,
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
			// Pass the URL to the retry function so it can be used for auth endpoint detection
			const originalRequestFn = async (): Promise<ApiResponse<T>> => {
				// Re-execute the full request flow including interceptors
				// Mark as refresh attempted to prevent infinite loop
				return this.executeRequestInternal<T>(url, method, config, data, true);
			};
			const apiResponse = await this.handleResponse<T>(
				response,
				method,
				originalRequestFn,
				hasAttemptedRefresh,
				fullUrl
			);

			// Execute response interceptors with generic type support
			const interceptedResponse = await this.interceptors.executeResponse<T>(apiResponse);

			return interceptedResponse;
		} catch (error) {
			// Create API error - error is unknown in catch block, but may already contain rich metadata
			const errorMessage = getErrorMessage(error);

			let statusCode: number = 0;
			let details: BaseData = { error: errorMessage };

			if (isRecord(error)) {
				const hasStatusCode = hasPropertyOfType(error, 'statusCode', VALIDATORS.number);
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
			const interceptedError = await this.interceptors.executeError(apiError);

			throw interceptedError;
		}
	}

	private async clearTokensAndThrowSessionExpired(): Promise<never> {
		await storageService.delete(STORAGE_KEYS.AUTH_TOKEN);
		await storageService.delete(STORAGE_KEYS.REFRESH_TOKEN);
		const sessionExpiredError = new Error(ERROR_MESSAGES.api.SESSION_EXPIRED);
		sessionExpiredError.name = 'SessionExpiredError';
		throw sessionExpiredError;
	}

	private async handleResponse<T>(
		response: Response,
		method: HttpMethod,
		originalRequest?: () => Promise<ApiResponse<T>>,
		hasAttemptedRefresh: boolean = false,
		requestUrl?: string
	): Promise<ApiResponse<T>> {
		if (!response.ok) {
			// Handle 401 Unauthorized - try to refresh token (only once per request)
			// Skip token refresh for authentication endpoints (login, register, refresh, logout)
			// These endpoints should not attempt token refresh as they are part of the auth flow
			const urlToCheck = requestUrl ?? response.url;
			const isAuthEndpoint =
				urlToCheck.includes('/auth/login') ||
				urlToCheck.includes('/auth/register') ||
				urlToCheck.includes('/auth/refresh') ||
				urlToCheck.includes('/auth/logout') ||
				urlToCheck.includes('/auth/google');

			if (response.status === 401 && originalRequest && !hasAttemptedRefresh && !isAuthEndpoint) {
				// Check if we have a refresh token before attempting refresh
				const refreshTokenResult = await storageService.getString(STORAGE_KEYS.REFRESH_TOKEN);
				const hasRefreshToken = refreshTokenResult.success && !!refreshTokenResult.data;

				if (hasRefreshToken) {
					try {
						// Refresh the token
						await this.refreshToken();

						// Verify token was stored before retrying request
						// Add a small delay to ensure token is fully stored
						await new Promise(resolve => setTimeout(resolve, 50));

						const tokenResult = await storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
						if (!tokenResult.success || !tokenResult.data) {
							await this.clearTokensAndThrowSessionExpired();
						}

						// Retry the original request with new token
						// The originalRequest function will mark hasAttemptedRefresh=true to prevent infinite loop
						const retryResponse = await originalRequest();

						// If retry also returns 401, don't try to refresh again
						if (retryResponse.statusCode === 401) {
							await this.clearTokensAndThrowSessionExpired();
						}
						return retryResponse;
					} catch (error) {
						// If error is already SessionExpiredError, re-throw it
						if (error instanceof Error && error.name === 'SessionExpiredError') {
							throw error;
						}
						// Refresh failed, clear tokens
						await this.clearTokensAndThrowSessionExpired();
					}
				} else {
					// No refresh token available, clear tokens and throw error
					await this.clearTokensAndThrowSessionExpired();
				}
			}

			let errorData: ErrorResponseData = {};
			let details: BaseData = {};
			const contentType = response.headers.get('content-type');

			if (contentType?.includes('application/json')) {
				try {
					const jsonData = await response.json();
					// Use shared error parsing utility
					errorData = parseErrorResponseData(jsonData);
					// Convert full JSON data to BaseData format for details
					if (isRecord(jsonData)) {
						details = this.convertToBaseData(jsonData);
					} else {
						errorData = { message: ERROR_MESSAGES.api.INVALID_ERROR_RESPONSE_FORMAT };
						details.message = ERROR_MESSAGES.api.INVALID_ERROR_RESPONSE_FORMAT;
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

			// Prioritize code field over message for error handling (code is more reliable)
			// Enhanced error message with more context (fallback to message if code not available)
			const errorMessage = getErrorMessage(
				errorData.code ?? errorData.message ?? errorData.error ?? `HTTP ${response.status}: ${response.statusText}`
			);

			const errorResponse: ApiError & {
				isServerError: boolean;
				isClientError: boolean;
				url: string;
				method: string;
				responseHeaders?: Headers;
			} = {
				message: errorMessage,
				code: errorData.code,
				statusCode: response.status,
				details: details,
				isServerError,
				isClientError,
				url: response.url,
				method: method,
				responseHeaders: response.headers, // Pass headers for Retry-After extraction
			};
			throw errorResponse;
		}

		const contentType = response.headers.get('content-type');
		let responseData: unknown;

		if (contentType?.includes('application/json')) {
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
				success: !!responseData.success,
				statusCode: response.status,
				timestamp: timestampValue,
			};

			if (this.isValidApiResponse<T>(apiResponse)) {
				return apiResponse;
			}

			throw new Error(ERROR_MESSAGES.api.INVALID_API_RESPONSE_STRUCTURE);
		}

		// Fallback for direct data responses
		const fallbackResponse: ApiResponse<unknown> = {
			data: responseData,
			success: true,
			statusCode: response.status,
			timestamp: new Date().toISOString(),
		};

		if (this.isValidApiResponse<T>(fallbackResponse)) {
			return fallbackResponse;
		}

		throw new Error(ERROR_MESSAGES.api.INVALID_API_FALLBACK_RESPONSE_STRUCTURE);
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
		const response = await this.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);

		// Server response is already in camelCase format
		const serverResponse = response.data;
		const authResult: AuthenticationResult = {
			user: serverResponse.user,
			accessToken: serverResponse.accessToken,
			refreshToken: serverResponse.refreshToken,
		};

		// Store tokens securely using centralized constants
		if (authResult.accessToken) {
			await storageService.set(STORAGE_KEYS.AUTH_TOKEN, authResult.accessToken);
		}
		if (authResult.refreshToken) {
			await storageService.set(STORAGE_KEYS.REFRESH_TOKEN, authResult.refreshToken);
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
			emails: { current: credentials.email },
		});

		const response = await this.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, registerPayload);

		// Server response is already in camelCase format
		const serverResponse = response.data;
		const authResult: AuthenticationResult = {
			user: serverResponse.user,
			accessToken: serverResponse.accessToken,
			refreshToken: serverResponse.refreshToken,
		};

		logger.authRegister('Register API response received', {
			userId: authResult.user?.id,
			emails: { current: authResult.user?.email },
		});

		// Store tokens securely using centralized constants
		// Note: Tokens are also stored in authService.setAuthData, but we store them here
		// to ensure they're available immediately for subsequent requests
		if (authResult.accessToken) {
			// Clear any existing token first to prevent conflicts
			await storageService.delete(STORAGE_KEYS.AUTH_TOKEN);
			await storageService.set(STORAGE_KEYS.AUTH_TOKEN, authResult.accessToken);

			// Verify token was stored correctly
			const storedTokenResult = await storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
			const storedToken = storedTokenResult.success ? storedTokenResult.data : null;

			logger.authInfo('Access token stored', {
				valueLength: authResult.accessToken.length,
				userId: authResult.user?.id,
				emails: { current: authResult.user?.email },
				tokenMatches: storedToken === authResult.accessToken,
			});
		}
		if (authResult.refreshToken) {
			await storageService.delete(STORAGE_KEYS.REFRESH_TOKEN);
			await storageService.set(STORAGE_KEYS.REFRESH_TOKEN, authResult.refreshToken);
			logger.authInfo('Refresh token stored');
		}

		return authResult;
	}

	async logout(): Promise<void> {
		try {
			// Skip retry for logout - if it fails (e.g., token expired), just clear local tokens
			await this.post(API_ENDPOINTS.AUTH.LOGOUT, undefined);
		} catch (error) {
			// Continue with logout even if server request fails
			// This is expected when token is expired/invalid
			const errorMessage = getErrorMessage(error);
			// Extract error code if available (prioritize code over message)
			const errorCode = isRecord(error) && 'code' in error && typeof error.code === 'string' ? error.code : undefined;

			// Check auth errors using ERROR_CODES constants (prioritize code, fallback to message)
			const isAuthError =
				errorCode === ERROR_CODES.AUTHENTICATION_TOKEN_REQUIRED ||
				errorCode === ERROR_CODES.USER_NOT_AUTHENTICATED ||
				errorCode === ERROR_CODES.UNAUTHORIZED ||
				// Fallback to message checks for backward compatibility
				errorMessage === ERROR_CODES.AUTHENTICATION_TOKEN_REQUIRED ||
				errorMessage.includes('Session expired') ||
				errorMessage.includes('401');

			if (isAuthError) {
				logger.apiDebug('Logout request failed due to expired/invalid token (expected)', {
					errorInfo: { message: errorMessage, code: errorCode },
				});
			} else {
				logger.apiWarn('Logout request failed, but clearing local tokens', {
					errorInfo: { message: errorMessage, code: errorCode },
				});
			}
		} finally {
			// Always clear local tokens
			await storageService.delete(STORAGE_KEYS.AUTH_TOKEN);
			await storageService.delete(STORAGE_KEYS.REFRESH_TOKEN);
		}
	}

	async refreshToken(): Promise<RefreshTokenResponse> {
		const refreshTokenResult = await storageService.getString(STORAGE_KEYS.REFRESH_TOKEN);
		const refreshToken = refreshTokenResult.success ? refreshTokenResult.data : null;
		if (!refreshToken) {
			throw new Error(ERROR_MESSAGES.api.NO_REFRESH_TOKEN_AVAILABLE);
		}

		const response = await this.post<RefreshTokenResponse>(API_ENDPOINTS.AUTH.REFRESH, {
			refreshToken,
		});

		// Store new access token
		if (response.data.accessToken) {
			await storageService.set(STORAGE_KEYS.AUTH_TOKEN, response.data.accessToken);
		}

		return response.data;
	}

	async getCurrentUser(): Promise<BasicUser> {
		const response = await this.get<BasicUser>(API_ENDPOINTS.AUTH.ME);
		return response.data;
	}

	async isAuthenticated(): Promise<boolean> {
		const tokenResult = await storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
		return tokenResult.success && !!tokenResult.data;
	}

	async getAuthToken(): Promise<string | null> {
		const tokenResult = await storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
		return tokenResult.success && tokenResult.data ? tokenResult.data : null;
	}

	// User methods
	async getUserProfile(): Promise<UserProfileResponseType> {
		const response = await this.get<UserProfileResponseType>(API_ENDPOINTS.USER.PROFILE);
		return response.data;
	}

	async updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileResponseType> {
		// Validate required fields
		if (!data || Object.keys(data).length === 0) {
			throw new Error(ERROR_MESSAGES.validation.PROFILE_DATA_REQUIRED);
		}

		const response = await this.put<UserProfileResponseType>(API_ENDPOINTS.USER.PROFILE, data);
		return response.data;
	}

	async setAvatar(avatarId: number): Promise<UserProfileResponseType> {
		// Validate avatar ID
		if (!Number.isInteger(avatarId) || avatarId < 1 || avatarId > 16) {
			throw new Error(ERROR_MESSAGES.validation.AVATAR_ID_OUT_OF_RANGE);
		}

		const response = await this.patch<UserProfileResponseType>(API_ENDPOINTS.USER.AVATAR, {
			avatarId,
		});
		return response.data;
	}

	async searchUsers(query: string, limit: number = 10): Promise<BasicUser[]> {
		// Validate input
		if (!isNonEmptyString(query)) {
			throw new Error(ERROR_MESSAGES.validation.SEARCH_QUERY_REQUIRED);
		}
		if (limit < 1 || limit > 100) {
			throw new Error(VALIDATION_MESSAGES.LIMIT_RANGE(1, 100));
		}

		const queryString = this.buildQueryString({
			query,
			limit,
		});

		const response = await this.get<BasicUser[]>(`${API_ENDPOINTS.USER.SEARCH}${queryString}`);
		return response.data;
	}

	// User preferences methods
	async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
		const response = await this.put<void>(API_ENDPOINTS.USER.PREFERENCES, preferences);
		return response.data;
	}

	// Account management methods
	async deleteUserAccount(): Promise<string> {
		const response = await this.delete<string>(API_ENDPOINTS.USER.ACCOUNT);
		return response.data;
	}

	async changePassword(changePasswordData: ChangePasswordData): Promise<string> {
		const response = await this.put<string>(API_ENDPOINTS.USER.CHANGE_PASSWORD, changePasswordData);
		return response.data;
	}
}

export const apiService = new ApiService();
