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
