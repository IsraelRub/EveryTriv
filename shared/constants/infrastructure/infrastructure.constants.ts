/**
 * Infrastructure constants for EveryTriv
 * Defines ports, URLs, and infrastructure configuration
 *
 * @module InfrastructureConstants
 * @description Infrastructure configuration constants
 * @used_by server/src/main.ts, client/vite.config.ts, docker-compose.yaml
 */

/**
 * Default server and client ports configuration
 * @constant
 * @description Standardized port configuration for development environment
 * @used_by server/src/main.ts, client/vite.config.ts, docker-compose.yaml
 */
export const DEFAULT_PORTS = {
	/** Express server port - Development mode */
	SERVER: 3003,
	/** Vite development server port */
	CLIENT: 3000,
	/** PostgreSQL database port */
	DATABASE: 5432,
	/** Redis cache server port */
	REDIS: 6379,
} as const;

/**
 * Environment-based URLs
 * @description Base URLs for different environments
 * @used_by server/src/shared/services/http-client.ts, client/src/services/api.service.ts, shared/services/storage.service.ts
 */
export const DEFAULT_URLS = {
	/** Development server URL */
	DEV_SERVER: `http://localhost:${DEFAULT_PORTS.SERVER}`,
	/** Development client URL */
	DEV_CLIENT: `http://localhost:${DEFAULT_PORTS.CLIENT}`,
	/** Production base domain */
	PROD_DOMAIN: 'everytrivia.com',
} as const;
