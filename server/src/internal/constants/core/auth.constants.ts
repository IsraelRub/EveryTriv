/**
 * Server Core Auth Constants
 * @module ServerCoreAuthConstants
 * @description Server-side authentication constants
 */

// Authentication constants (server-only)
export enum TokenType {
	BEARER = 'Bearer',
}

export enum AuthHeader {
	AUTHORIZATION = 'Authorization',
}

export const AUTH_CONSTANTS = {
	JWT_EXPIRATION: '24h',
	JWT_REFRESH_EXPIRATION: '7d',
	REFRESH_TOKEN_EXPIRATION: '7d',
	TOKEN_TYPE: TokenType.BEARER,
	AUTH_HEADER: AuthHeader.AUTHORIZATION,
	JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
	JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
} as const;

// Cookie names (server-only)
export const COOKIE_NAMES = {
	AUTH_TOKEN: 'auth_token',
	REFRESH_TOKEN: 'refresh_token',
	USER_PREFERENCES: 'user_preferences',
} as const;
