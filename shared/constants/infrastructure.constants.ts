/**
 * Infrastructure constants for EveryTriv
 * Defines ports, URLs, and infrastructure configuration
 *
 * @module InfrastructureConstants
 * @description Infrastructure configuration constants
 * @used_by server: server/src/main.ts, client: vite.config.ts, docker-compose.yaml
 */

/**
 * Default server and client ports configuration
 * @constant
 * @description Standardized port configuration for development environment
 * @used_by server: server/src/main.ts (bootstrap port), client: vite.config.ts (dev server port), docker-compose.yaml (service ports)
 */
export const DEFAULT_PORTS = {
	/** Express server port */
	SERVER: 3002,
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
 * @used_by server: server/src/shared/services/http-client.ts (base URL), client: client/src/services/api.service.ts (API base URL), shared/services/storage.service.ts (service URLs)
 */
export const DEFAULT_URLS = {
	/** Development server URL */
	DEV_SERVER: `http://localhost:${DEFAULT_PORTS.SERVER}`,
	/** Development client URL */
	DEV_CLIENT: `http://localhost:${DEFAULT_PORTS.CLIENT}`,
	/** Production base domain */
	PROD_DOMAIN: 'everytrivia.com',
} as const;
