import {
	API_ENDPOINTS,
	AVATAR_ALLOWED_MIME_TYPES_SET,
	AVATAR_UPLOAD_MAX_BYTES,
	ERROR_MESSAGES,
	ErrorCode,
	HTTP_CLIENT_CONFIG,
	HTTP_STATUS_CODES,
	HttpMethod,
	isLocalhostClientOrigin,
	LOCALHOST_CONFIG,
	TIME_PERIODS_MS,
	VALIDATION_COUNT,
	VITE_API_BUNDLE_USE_ORIGIN_PREFIX,
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
	UserSearchCacheEntry,
} from '@shared/types';
import {
	delay,
	getErrorMessage,
	hasProperty,
	hasPropertyOfType,
	isNonEmptyString,
	isRecord,
	parseErrorResponseData,
} from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { StorageKeys, VALIDATION_MESSAGES } from '@/constants';
import type { AuthResponse, EnhancedRequestConfig } from '@/types';
import { clientLogger as logger, storageService } from '@/services';
import { authRequestInterceptor, InterceptorsService } from './interceptors.service';

export class ApiConfig {
	static get baseUrl(): string {
		const envUrl = import.meta.env.VITE_API_BASE_URL;
		if (envUrl === VITE_API_BUNDLE_USE_ORIGIN_PREFIX) {
			if (typeof window !== 'undefined' && isNonEmptyString(window.location?.origin)) {
				return `${window.location.origin}/api`;
			}
			return LOCALHOST_CONFIG.urls.SERVER;
		}
		if (isNonEmptyString(envUrl)) {
			return envUrl;
		}
		return LOCALHOST_CONFIG.urls.SERVER;
	}

	static get oauthBaseUrl(): string {
		if (
			typeof window !== 'undefined' &&
			isNonEmptyString(window.location?.origin) &&
			isLocalhostClientOrigin(window.location.origin)
		) {
			return LOCALHOST_CONFIG.urls.SERVER;
		}
		if (
			import.meta.env.VITE_API_BASE_URL === VITE_API_BUNDLE_USE_ORIGIN_PREFIX &&
			typeof window !== 'undefined' &&
			isNonEmptyString(window.location?.origin)
		) {
			return window.location.origin;
		}
		return ApiConfig.baseUrl;
	}
}

class ApiService {
	private baseURL: string;
	private readonly interceptors: InterceptorsService;
	private activeRequests = new Map<string, Promise<ApiResponse<unknown>>>();

	private refreshTokenInFlight: Promise<RefreshTokenResponse> | null = null;

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
		this.baseURL = ApiConfig.baseUrl;
		this.interceptors = new InterceptorsService();

		// Register auth request interceptor
		this.interceptors.useRequest(authRequestInterceptor);
	}

	private createTimeoutController(timeoutMs: number): {
		controller: AbortController;
		timeoutId: ReturnType<typeof setTimeout>;
	} {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			controller.abort();
		}, timeoutMs);
		return { controller, timeoutId };
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
		const shouldDeduplicate = method === HttpMethod.GET && !config.skipDeduplication;

		// Check for duplicate request (if not skipped)
		if (shouldDeduplicate) {
			const existingRequest = this.activeRequests.get(requestKey);
			if (existingRequest) {
				const response = await existingRequest;
				if (this.isValidApiResponse<T>(response)) {
					return response;
				}
				throw new Error(ERROR_MESSAGES.api.INVALID_API_RESPONSE_STRUCTURE);
			}
		}

		// Execute request directly (retry logic is handled by QueryClient)
		const requestPromise = this.executeRequestInternal<T>(url, method, config, data, false);

		// Store active request for deduplication
		if (shouldDeduplicate) {
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
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		let detachAbortListeners: (() => void) | null = null;
		try {
			// Merge timeout with signal
			const timeout = config.timeout ?? HTTP_CLIENT_CONFIG.TIMEOUT;
			const timeoutBundle = this.createTimeoutController(timeout);
			const timeoutController = timeoutBundle.controller;
			timeoutId = timeoutBundle.timeoutId;

			// Combine signals if both provided (use provided signal as primary, timeout as fallback)
			let signal: AbortSignal = timeoutController.signal;
			if (config.signal) {
				// Check if provided signal is already aborted before creating combined controller
				if (config.signal.aborted) {
					// If signal is already aborted, abort timeout controller and throw immediately
					timeoutController.abort();
					const abortError = new Error('Request aborted');
					abortError.name = 'AbortError';
					Object.assign(abortError, {
						isAborted: true,
						statusCode: 0,
					});
					throw abortError;
				}

				// Create a combined controller that aborts when either signal aborts
				const combinedController = new AbortController();
				const isEitherAborted = () => [config.signal?.aborted, timeoutController.signal.aborted].some(Boolean);
				const abortIfNeeded = () => {
					if (isEitherAborted()) {
						combinedController.abort();
					}
				};

				// Set up event listeners for both signals
				config.signal.addEventListener('abort', abortIfNeeded);
				timeoutController.signal.addEventListener('abort', abortIfNeeded);
				detachAbortListeners = () => {
					config.signal?.removeEventListener('abort', abortIfNeeded);
					timeoutController.signal.removeEventListener('abort', abortIfNeeded);
				};

				// Check again after setting up listeners in case signal was aborted in between
				if (isEitherAborted()) {
					combinedController.abort();
				}

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

			const isRefreshEndpoint = url === API_ENDPOINTS.AUTH.REFRESH;

			if (data && (method === HttpMethod.POST || method === HttpMethod.PUT || method === HttpMethod.PATCH)) {
				requestBody = JSON.stringify(data);

				// Debug logging for request body (runs in all environments)
				if (isRefreshEndpoint) {
					logger.apiDebug('Request body prepared', { url, method, redacted: true });
				} else {
					logger.apiDebug('Request body prepared', {
						url,
						method,
						requestBody,
						body: isRecord(data) ? data : undefined,
					});
				}
			} else {
				// Log when body is not prepared
				logger.apiDebug('Request body not prepared', {
					url,
					method,
				});
			}

			// Omit conflicting RequestInit keys so explicit values below stay authoritative.
			const {
				body: interceptedBody,
				method: interceptedMethod,
				headers: interceptedHeaders,
				signal: interceptedSignal,
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
				...configWithoutRequestInit,
				method,
				headers,
				signal: interceptedConfig.signal,
				credentials: 'include',
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
				if (isRefreshEndpoint) {
					logger.apiDebug('Fetch config prepared', { url, method, redacted: true });
				} else {
					logger.apiDebug('Fetch config prepared', {
						url,
						method,
						valueLength: VALIDATORS.string(fetchConfig.body) ? fetchConfig.body.length : 0,
						...(contentTypeValue && { contentType: contentTypeValue }),
					});
				}
			}

			// Execute fetch
			const fullUrl = (interceptedConfig.baseURL ?? this.baseURL) + url;
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

			return apiResponse;
		} catch (error) {
			// Check if error is an abort error (from AbortController or fetch abort)
			const isAbortError =
				error instanceof Error &&
				(error.name === 'AbortError' ||
					error.message.includes('aborted') ||
					error.message === 'signal is aborted without reason' ||
					(isRecord(error) && hasProperty(error, 'isAborted') && error.isAborted));

			// If it's an abort error, create a proper error with clear message
			if (isAbortError) {
				const abortError: ApiError = {
					message: 'Request was cancelled',
					statusCode: 0,
					details: {
						error: 'Request was cancelled',
						reason: 'The request was aborted, likely due to a new request being made or timeout',
					},
				};
				// Don't execute interceptors for abort errors - they're expected and shouldn't be logged as errors
				throw abortError;
			}

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

			throw apiError;
		} finally {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}
			detachAbortListeners?.();
		}
	}

	private async clearTokensAndThrowSessionExpired(): Promise<never> {
		await storageService.delete(StorageKeys.AUTH_TOKEN);
		await storageService.delete(StorageKeys.REFRESH_TOKEN);
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
				const refreshTokenResult = await storageService.getString(StorageKeys.REFRESH_TOKEN);
				const hasRefreshToken = refreshTokenResult.success && refreshTokenResult.data;

				if (hasRefreshToken) {
					try {
						// Refresh the token
						await this.refreshToken();

						// Verify token was stored before retrying request
						// Add a small delay to ensure token is fully stored
						await delay(TIME_PERIODS_MS.FIFTY_MILLISECONDS);

						const tokenResult = await storageService.getString(StorageKeys.AUTH_TOKEN);
						if (!tokenResult.success || !tokenResult.data) {
							await this.clearTokensAndThrowSessionExpired();
						}

						// Retry the original request with new token
						// The originalRequest function will mark hasAttemptedRefresh=true to prevent infinite loop
						const retryResponse = await originalRequest();
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
				let textMessage: string;
				try {
					textMessage = await response.text();
				} catch (textError) {
					textMessage = getErrorMessage(textError);
				}
				errorData = { message: textMessage };
				details.message = textMessage;
			}

			const isServerError =
				response.status >= HTTP_STATUS_CODES.SERVER_ERROR_MIN && response.status <= HTTP_STATUS_CODES.SERVER_ERROR_MAX;
			const isClientError =
				response.status >= HTTP_STATUS_CODES.BAD_REQUEST && response.status < HTTP_STATUS_CODES.SERVER_ERROR_MIN;

			let errorMessage = getErrorMessage(errorData);
			if (errorMessage === ERROR_MESSAGES.general.UNKNOWN_ERROR) {
				errorMessage = `HTTP ${response.status}: ${response.statusText}`;
			}

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
				'timestamp' in responseData && VALIDATORS.string(responseData.timestamp)
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
			await storageService.setString(StorageKeys.AUTH_TOKEN, authResult.accessToken);
		}
		if (authResult.refreshToken) {
			await storageService.setString(StorageKeys.REFRESH_TOKEN, authResult.refreshToken);
			await storageService.setString(StorageKeys.PERSISTENT_REFRESH_TOKEN, authResult.refreshToken);
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
		const firstNameTrimmed = credentials.firstName?.trim();
		const lastNameTrimmed = credentials.lastName?.trim();
		if (firstNameTrimmed) registerPayload.firstName = firstNameTrimmed;
		if (lastNameTrimmed) registerPayload.lastName = lastNameTrimmed;

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
			await storageService.delete(StorageKeys.AUTH_TOKEN);
			await storageService.setString(StorageKeys.AUTH_TOKEN, authResult.accessToken);

			// Verify token was stored correctly
			const storedTokenResult = await storageService.getString(StorageKeys.AUTH_TOKEN);
			const storedToken = storedTokenResult.success ? storedTokenResult.data : null;

			logger.authInfo('Access token stored', {
				valueLength: authResult.accessToken.length,
				userId: authResult.user?.id,
				emails: { current: authResult.user?.email },
				tokenMatches: storedToken === authResult.accessToken,
			});
		}
		if (authResult.refreshToken) {
			await storageService.delete(StorageKeys.REFRESH_TOKEN);
			await storageService.setString(StorageKeys.REFRESH_TOKEN, authResult.refreshToken);
			await storageService.setString(StorageKeys.PERSISTENT_REFRESH_TOKEN, authResult.refreshToken);
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
			const errorCode = isRecord(error) && 'code' in error && VALIDATORS.string(error.code) ? error.code : undefined;

			const isAuthError =
				errorCode === ErrorCode.AUTHENTICATION_TOKEN_REQUIRED ||
				errorCode === ErrorCode.USER_NOT_AUTHENTICATED ||
				errorCode === ErrorCode.UNAUTHORIZED;

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
			await storageService.delete(StorageKeys.AUTH_TOKEN);
			await storageService.delete(StorageKeys.REFRESH_TOKEN);
		}
	}

	async refreshToken(): Promise<RefreshTokenResponse> {
		if (this.refreshTokenInFlight) {
			return this.refreshTokenInFlight;
		}
		const promise = this.executeRefreshToken();
		this.refreshTokenInFlight = promise;
		promise.finally(() => {
			if (this.refreshTokenInFlight === promise) {
				this.refreshTokenInFlight = null;
			}
		});
		return promise;
	}

	private async executeRefreshToken(): Promise<RefreshTokenResponse> {
		const refreshTokenResult = await storageService.getString(StorageKeys.REFRESH_TOKEN);
		const refreshToken = refreshTokenResult.success ? refreshTokenResult.data : null;
		if (!refreshToken) {
			throw new Error(ERROR_MESSAGES.api.NO_REFRESH_TOKEN_AVAILABLE);
		}

		const response = await this.post<RefreshTokenResponse>(API_ENDPOINTS.AUTH.REFRESH, {
			refreshToken,
		});

		// Store new access token
		if (response.data.accessToken) {
			await storageService.setString(StorageKeys.AUTH_TOKEN, response.data.accessToken);
		}

		return response.data;
	}

	async getCurrentUser(): Promise<BasicUser> {
		const response = await this.get<BasicUser>(API_ENDPOINTS.AUTH.ME);
		return response.data;
	}

	async acceptLegalConsent(): Promise<BasicUser> {
		const response = await this.post<BasicUser>(API_ENDPOINTS.AUTH.LEGAL_ACCEPTANCE, { accepted: true });
		return response.data;
	}

	// User methods
	async getUserProfile(): Promise<UserProfileResponseType> {
		const response = await this.get<UserProfileResponseType>(API_ENDPOINTS.USER.PROFILE);
		return response.data;
	}

	async updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileResponseType> {
		// Validate required fields
		if (!data || Object.keys(data).length === 0) {
			throw new Error(ERROR_MESSAGES.user.PROFILE_DATA_REQUIRED);
		}

		const response = await this.put<UserProfileResponseType>(API_ENDPOINTS.USER.PROFILE, data);
		return response.data;
	}

	async setAvatar(avatarId: number): Promise<UserProfileResponseType> {
		const { MAX } = VALIDATION_COUNT.AVATAR_ID;
		if (!Number.isInteger(avatarId) || avatarId < 0 || avatarId > MAX) {
			throw new Error(ERROR_MESSAGES.user.AVATAR_ID_OUT_OF_RANGE);
		}

		const response = await this.patch<UserProfileResponseType>(API_ENDPOINTS.USER.AVATAR, {
			avatarId,
		});
		return response.data;
	}

	async uploadAvatar(file: File): Promise<UserProfileResponseType> {
		if (file.size > AVATAR_UPLOAD_MAX_BYTES) {
			throw new Error(ERROR_MESSAGES.user.AVATAR_UPLOAD_FILE_TOO_LARGE);
		}
		const mime = (file.type ?? '').toLowerCase();
		if (!AVATAR_ALLOWED_MIME_TYPES_SET.has(mime)) {
			throw new Error(ERROR_MESSAGES.user.AVATAR_UPLOAD_INVALID_TYPE);
		}
		const formData = new FormData();
		formData.append('file', file);
		const response = await this.postFormData<UserProfileResponseType>(API_ENDPOINTS.USER.AVATAR_UPLOAD, formData);
		return response.data;
	}

	private async postFormData<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
		const fullUrl = this.baseURL + url;
		const enhancedConfig: EnhancedRequestConfig = {
			method: HttpMethod.POST,
			baseURL: this.baseURL,
			credentials: 'include',
		};
		const interceptedConfig = await this.interceptors.executeRequest(enhancedConfig);
		const headers = new Headers(interceptedConfig.headers);
		headers.delete('Content-Type');
		const response = await fetch(fullUrl, {
			method: HttpMethod.POST,
			headers,
			body: formData,
			credentials: 'include',
			signal: interceptedConfig.signal,
		});
		const originalRequestFn = async (): Promise<ApiResponse<T>> => this.postFormData<T>(url, formData);
		const apiResponse = await this.handleResponse<T>(response, HttpMethod.POST, originalRequestFn, false, fullUrl);
		return apiResponse;
	}

	async searchUsers(query: string, limit: number = 10): Promise<UserSearchCacheEntry> {
		// Validate input
		if (!isNonEmptyString(query)) {
			throw new Error(ERROR_MESSAGES.user.SEARCH_QUERY_REQUIRED);
		}
		if (limit < 1 || limit > 100) {
			throw new Error(VALIDATION_MESSAGES.LIMIT_RANGE(1, 100));
		}

		const queryString = this.buildQueryString({
			query,
			limit,
		});

		const response = await this.get<UserSearchCacheEntry>(API_ENDPOINTS.USER.SEARCH + queryString);
		return response.data;
	}

	// User preferences methods
	async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
		const response = await this.put<void>(API_ENDPOINTS.USER.PREFERENCES, preferences);
		return response.data;
	}

	// Account management methods
	async changePassword(changePasswordData: ChangePasswordData): Promise<string> {
		const response = await this.put<string>(API_ENDPOINTS.USER.CHANGE_PASSWORD, changePasswordData);
		return response.data;
	}
}

export const apiService = new ApiService();
