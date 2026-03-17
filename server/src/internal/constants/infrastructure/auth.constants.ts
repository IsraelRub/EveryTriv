export const AUTH_CONSTANTS = {
	JWT_EXPIRATION: '24h',
	JWT_REFRESH_EXPIRATION: '7d',
	REFRESH_TOKEN_EXPIRATION: '7d',
	TOKEN_TYPE: 'Bearer',
	AUTH_HEADER: 'Authorization',
} as const;

export const COOKIE_NAMES = {
	AUTH_TOKEN: 'access_token',
	REFRESH_TOKEN: 'refresh_token',
	USER_PREFERENCES: 'user_preferences',
} as const;
