/**
 * Authentication constants for EveryTriv
 * Shared authentication configuration
 */

// Token types enum
export enum TokenType {
	BEARER = 'Bearer',
}

// Auth headers enum
export enum AuthHeader {
	AUTHORIZATION = 'Authorization',
}

/**
 * Authentication event enum
 * @enum AuthenticationEvent
 * @description Events for authentication logging
 */
export enum AuthenticationEvent {
	LOGIN = 'login',
	LOGOUT = 'logout',
	REGISTER = 'register',
	TOKEN_REFRESH = 'token_refresh',
	PASSWORD_CHANGE = 'password_change',
	PROFILE_UPDATE = 'profile_update',
}

/**
 * OAuth callback status enum
 * @enum CallbackStatus
 * @description Status of OAuth callback processing
 */
export enum CallbackStatus {
	PROCESSING = 'processing',
	SUCCESS = 'success',
	ERROR = 'error',
}

/**
 * OAuth error types enum
 * @enum OAuthErrorType
 * @description Types of OAuth errors
 */
export enum OAuthErrorType {
	INVALID_CLIENT = 'invalid_client',
	OAUTH_FAILED = 'oauth_failed',
	NO_TOKEN = 'no_token',
	UNEXPECTED_ERROR = 'unexpected_error',
}

/**
 * Authentication provider enumeration
 * @enum AuthProvider
 * @description Available authentication providers
 */
export enum AuthProvider {
	LOCAL = 'local',
	GOOGLE = 'google',
}

// Auth constants
export const AUTH_CONSTANTS = {
	JWT_EXPIRATION: '24h',
	JWT_REFRESH_EXPIRATION: '7d',
	REFRESH_TOKEN_EXPIRATION: '7d',
	TOKEN_TYPE: TokenType.BEARER,
	AUTH_HEADER: AuthHeader.AUTHORIZATION,
	JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
	JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
} as const;
