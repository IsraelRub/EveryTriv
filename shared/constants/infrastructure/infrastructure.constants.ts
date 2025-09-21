/**
 * Infrastructure constants for EveryTriv
 * Defines ports, URLs, and infrastructure configuration
 *
 * @module InfrastructureConstants
 * @description Infrastructure configuration constants
 * @used_by server/src/main.ts, client/vite.config.ts
 */

/**
 * Default server and client ports configuration
 * @constant
 * @description Standardized port configuration for development environment
 * @used_by server/src/main.ts, client/vite.config.ts
 */
export const DEFAULT_PORTS = {
	SERVER: 3003,
	CLIENT: 3000,
	DATABASE: 5432,
	REDIS: 6379,
} as const;

/**
 * Environment-based URLs
 * @description Base URLs for different environments
 * @used_by server/src/shared/services/http-client.ts, client/src/services/api.service.ts, shared/services/storage.service.ts
 */
export const DEFAULT_URLS = {
	DEV_SERVER: `http://localhost:${DEFAULT_PORTS.SERVER}`,
	DEV_CLIENT: `http://localhost:${DEFAULT_PORTS.CLIENT}`,
	PROD_DOMAIN: 'everytrivia.com',
} as const;
