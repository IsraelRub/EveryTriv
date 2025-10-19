/**
 * Client API Configuration Service
 * Client-specific service for managing API URLs and configuration
 *
 * @module ClientApiConfigService
 * @description Client-side API configuration management using import.meta.env
 * @used_by client/src/services/api, client/src/services/auth
 */

import { API_BASE_URL, ENV_VAR_NAMES } from '@shared/constants';

/**
 * Client-side API configuration service
 * Provides consistent API URL management for the client application
 */
export class ClientApiConfigService {
	/**
	 * Get the base API URL based on environment
	 */
	static getBaseUrl(): string {
		// Check for Vite environment variable first
		const envUrl = import.meta.env[ENV_VAR_NAMES.API_BASE_URL];
		if (envUrl) {
			return envUrl;
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
        return import.meta.env.MODE === 'development' ||
               import.meta.env.DEV ||
               this.getBaseUrl().includes('localhost');
    }

	/**
	 * Check if running in production mode
	 */
    static isProduction(): boolean {
        return import.meta.env.MODE === 'production' ||
               import.meta.env.PROD;
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
