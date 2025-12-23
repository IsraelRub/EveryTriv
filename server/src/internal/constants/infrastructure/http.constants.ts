/**
 * Server Infrastructure HTTP Constants
 * @module ServerInfrastructureHTTPConstants
 * @description Server-side HTTP constants
 */

/**
 * Environment variable names (server-only)
 */
export const ENV_VAR_NAMES = {
	API_BASE_URL: 'VITE_API_BASE_URL',
	CLIENT_URL: 'VITE_CLIENT_URL',
	SERVER_URL: 'VITE_SERVER_URL',
	DATABASE_HOST: 'DATABASE_HOST',
	DATABASE_PORT: 'DATABASE_PORT',
	REDIS_HOST: 'REDIS_HOST',
	REDIS_PORT: 'REDIS_PORT',
	CORS_ORIGIN: 'CORS_ORIGIN',
} as const;

/**
 * Fallback values for environment variables (server-only)
 */
export const ENV_FALLBACKS = {
	API_BASE_URL: 'http://localhost:3001',
	CLIENT_URL: 'http://localhost:5173',
	SERVER_URL: 'http://localhost:3001',
	DATABASE_HOST: 'localhost',
	DATABASE_PORT: 5432,
	REDIS_HOST: 'localhost',
	REDIS_PORT: 6379,
	CORS_ORIGIN: 'http://localhost:5173',
} as const;
