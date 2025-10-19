/**
 * Server-specific authentication constants for EveryTriv
 * Server-only authentication configuration
 */
// Import and re-export shared enums
import { AuthHeader, TokenType } from '@shared/constants';

export { AuthHeader, TokenType };

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
