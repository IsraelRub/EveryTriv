/**
 * Infrastructure constants for EveryTriv
 * Defines ports, URLs, and infrastructure configuration
 *
 * @module InfrastructureConstants
 * @description Infrastructure configuration constants
 * @used_by server/src/main.ts, client/vite.config.ts
 */
import { LOCALHOST_PORTS, LOCALHOST_URLS } from './localhost.constants';

/**
 * Default server and client ports configuration
 * @constant
 * @description Standardized port configuration for development environment
 * @used_by server/src/main.ts, client/vite.config.ts
 */
export const DEFAULT_PORTS = {
	SERVER: LOCALHOST_PORTS.SERVER,
	CLIENT: LOCALHOST_PORTS.CLIENT,
	DATABASE: LOCALHOST_PORTS.DATABASE,
	REDIS: LOCALHOST_PORTS.REDIS,
} as const;

/**
 * Environment-based URLs
 * @description Base URLs for different environments
 * @used_by server/src/internal/utils/interceptors.utils.ts, client/src/services/api.service.ts, shared/services/storage
 */
export const DEFAULT_URLS = {
	DEV_SERVER: LOCALHOST_URLS.API_BASE,
	DEV_CLIENT: LOCALHOST_URLS.CLIENT,
} as const;
