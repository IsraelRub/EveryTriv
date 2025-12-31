/**
 * Auth Request Interceptor
 *
 * @module AuthInterceptor
 * @description Automatically adds Authorization headers to requests
 * @used_by client/src/services/api.service.ts
 */
import { CLIENT_STORAGE_KEYS } from '@/constants';
import { storageService } from '@/services';
import type { EnhancedRequestConfig, RequestInterceptor } from '@/types';

/**
 * Auth request interceptor
 * @description Adds Authorization header with Bearer token to requests (unless skipAuth is true)
 */
export const authRequestInterceptor: RequestInterceptor = async (
	config: EnhancedRequestConfig
): Promise<EnhancedRequestConfig> => {
	// Skip auth if explicitly requested
	if (config.skipAuth) {
		return config;
	}

	// Get auth token from storage
	const tokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
	const token = tokenResult.success ? tokenResult.data : null;

	// Add Authorization header if token exists
	if (token) {
		return {
			...config,
			headers: {
				...config.headers,
				Authorization: `Bearer ${token}`,
			},
		};
	}

	return config;
};
