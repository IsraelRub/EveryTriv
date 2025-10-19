/**
 * Server API Configuration Service
 * Server-specific service for managing API URLs and configuration
 *
 * @module ServerApiConfigService
 * @description Server-side API configuration management using process.env
 * @used_by server/src/config, server/src/features
 */

import { API_BASE_URL, ENV_VAR_NAMES } from '@shared/constants';

/**
 * Server-side API configuration service
 * Provides consistent API URL management for the server application
 */
export class ServerApiConfigService {
	/**
	 * Get the base API URL based on environment
	 */
	static getBaseUrl(): string {
		// Check for process.env (server-side)
		if (process.env[ENV_VAR_NAMES.API_BASE_URL]) {
			return process.env[ENV_VAR_NAMES.API_BASE_URL] as string;
		}
		
		// Fallback to development URL
		return API_BASE_URL.DEVELOPMENT;
	}

	/**
	 * Get authentication URL
	 */
	static getAuthUrl(): string {
		return `${this.getBaseUrl()}/auth`;
	}

	/**
	 * Get API URL for specific endpoint
	 */
	static getApiUrl(endpoint: string): string {
		// Ensure endpoint starts with /
		const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
		return `${this.getBaseUrl()}${normalizedEndpoint}`;
	}

	/**
	 * Get Google OAuth URL
	 */
	static getGoogleAuthUrl(): string {
		return `${this.getAuthUrl()}/google`;
	}

	/**
	 * Get Google OAuth callback URL
	 */
	static getGoogleCallbackUrl(): string {
		return `${this.getAuthUrl()}/google/callback`;
	}

	/**
	 * Check if running in development mode
	 */
	static isDevelopment(): boolean {
		return process.env.NODE_ENV === 'development';
	}

	/**
	 * Check if running in production mode
	 */
	static isProduction(): boolean {
		return process.env.NODE_ENV === 'production';
	}

	/**
	 * Get environment name
	 */
	static getEnvironment(): 'development' | 'production' | 'staging' {
		if (this.isDevelopment()) return 'development';
		if (this.isProduction()) return 'production';
		return 'staging';
	}
}
