/**
 * API Types for EveryTriv Client
 *
 * @module ClientApiTypes
 * @description Client-specific API service interface and response types
 */
import type {
	ApiResponse,
	AuthCredentials,
	AuthenticationResult,
	BasicUser,
	ChangePasswordData,
	ClientLogsRequest,
	CreditBalance,
	PaymentResult,
	RefreshTokenResponse,
	RequestData,
	UpdateUserProfileData,
	UserPreferences,
	UserProfileResponseType,
} from '@shared/types';
import type { EnhancedRequestConfig } from './interceptors.types';

/**
 * API error response interface
 * @interface ApiError
 * @description Standard error response structure
 * @used_by client/src/services/api.service.ts (error handling)
 */
export interface ApiError {
	message: string;
	code?: string;
	statusCode: number;
	timestamp?: string;
	details?: Record<string, unknown>;
}

/**
 * Error response data interface
 * @interface ErrorResponseData
 * @description Error data structure from API error responses
 * @used_by client/src/services/api.service.ts
 */
export type ErrorDetail = string | string[] | Record<string, string | string[]>;

export interface ErrorResponseData {
	message?: string;
	error?: string;
	detail?: string;
	description?: string;
	errors?: ErrorDetail;
}

/**
 * Authentication response from server (login/register)
 * @interface ServerAuthResponse
 * @description Server response format for authentication endpoints
 * @used_by client/src/services/api.service.ts (login, register)
 */
export interface ServerAuthResponse {
	access_token?: string;
	refresh_token?: string;
	user?: BasicUser;
}

export interface CreditsPurchaseResponse extends PaymentResult {
	balance?: CreditBalance;
}

export interface ClientApiService {
	// HTTP methods
	get<T>(url: string, config?: EnhancedRequestConfig): Promise<ApiResponse<T>>;
	post<T>(url: string, data?: RequestData, config?: EnhancedRequestConfig): Promise<ApiResponse<T>>;
	put<T>(url: string, data?: RequestData, config?: EnhancedRequestConfig): Promise<ApiResponse<T>>;
	delete<T>(url: string, config?: EnhancedRequestConfig): Promise<ApiResponse<T>>;

	// Auth methods
	login(credentials: AuthCredentials): Promise<AuthenticationResult>;
	register(credentials: AuthCredentials): Promise<AuthenticationResult>;
	logout(): Promise<void>;
	refreshToken(): Promise<RefreshTokenResponse>;

	// User methods
	getCurrentUser(): Promise<BasicUser>;
	getUserProfile(): Promise<UserProfileResponseType>;
	updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileResponseType>;
	searchUsers(query: string, limit?: number): Promise<BasicUser[]>;

	// User preferences methods
	updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void>;

	// Account management methods
	deleteUserAccount(): Promise<string>;
	changePassword(changePasswordData: ChangePasswordData): Promise<string>;

	// Client logs methods
	submitClientLogs(logs: ClientLogsRequest): Promise<string>;
}
