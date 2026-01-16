export enum AuthenticationEvent {
	LOGIN = 'login',
	LOGOUT = 'logout',
	REGISTER = 'register',
	TOKEN_REFRESH = 'token_refresh',
	PASSWORD_CHANGE = 'password_change',
	PROFILE_UPDATE = 'profile_update',
}

export enum CallbackStatus {
	PROCESSING = 'processing',
	SUCCESS = 'success',
	ERROR = 'error',
}

export enum OAuthErrorType {
	INVALID_CLIENT = 'invalid_client',
	OAUTH_FAILED = 'oauth_failed',
	NO_TOKEN = 'no_token',
	UNEXPECTED_ERROR = 'unexpected_error',
}

export enum AuthProvider {
	LOCAL = 'local',
	GOOGLE = 'google',
}

export const AUTH_CONSTANTS = {
	JWT_EXPIRATION: '24h',
	JWT_REFRESH_EXPIRATION: '7d',
	REFRESH_TOKEN_EXPIRATION: '7d',
	TOKEN_TYPE: 'Bearer',
	AUTH_HEADER: 'Authorization',
} as const;
