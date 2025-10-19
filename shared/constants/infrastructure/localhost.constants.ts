/**
 * Localhost configuration constants for EveryTriv
 * Used by both client and server for development environment
 *
 * @module LocalhostConstants
 * @description Centralized localhost URLs and ports configuration
 * @used_by client/src/services, server/src/config, shared/constants
 */

// Localhost URLs configuration
export const LOCALHOST_URLS = {
	// API URLs
	API_BASE: 'http://localhost:3001',
	API_HEALTH: 'http://localhost:3001/health',
	
	// Client URLs  
	CLIENT_BASE: 'http://localhost:5173',
	CLIENT_DEV: 'http://localhost:3000',
	
	// Admin interfaces
	PGADMIN_URL: 'http://localhost:8080',
	REDIS_COMMANDER_URL: 'http://localhost:8081',
	WEBDB_URL: 'http://localhost:22071',
} as const;

// Localhost ports configuration
export const LOCALHOST_PORTS = {
	SERVER: 3001,
	CLIENT: 5173,
	CLIENT_DEV: 3000,
	DATABASE: 5432,
	REDIS: 6379,
	PGADMIN: 8080,
	REDIS_COMMANDER: 8081,
	WEBDB: 22071,
} as const;

// Localhost hosts configuration
export const LOCALHOST_HOSTS = {
	DATABASE: 'localhost',
	REDIS: 'localhost',
	DOMAIN: 'localhost',
} as const;

// Environment variable names (unified)
export const ENV_VAR_NAMES = {
	API_BASE_URL: 'VITE_API_BASE_URL', // Unified name for API URL
	CLIENT_URL: 'VITE_CLIENT_URL',
	SERVER_URL: 'VITE_SERVER_URL',
	DATABASE_HOST: 'DATABASE_HOST',
	DATABASE_PORT: 'DATABASE_PORT',
	REDIS_HOST: 'REDIS_HOST',
	REDIS_PORT: 'REDIS_PORT',
	CORS_ORIGIN: 'CORS_ORIGIN',
} as const;

// Fallback values for environment variables
export const ENV_FALLBACKS = {
	API_BASE_URL: LOCALHOST_URLS.API_BASE,
	CLIENT_URL: LOCALHOST_URLS.CLIENT_BASE,
	SERVER_URL: LOCALHOST_URLS.API_BASE,
	DATABASE_HOST: LOCALHOST_HOSTS.DATABASE,
	DATABASE_PORT: LOCALHOST_PORTS.DATABASE,
	REDIS_HOST: LOCALHOST_HOSTS.REDIS,
	REDIS_PORT: LOCALHOST_PORTS.REDIS,
	CORS_ORIGIN: LOCALHOST_URLS.CLIENT_DEV,
} as const;
