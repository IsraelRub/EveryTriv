import { getErrorMessage } from '@shared/utils';

import { StorageKeys } from '@/constants';
import type { EnhancedRequestConfig, InterceptorEntry, RequestInterceptor } from '@/types';
import { clientLogger as logger, storageService } from '@/services';

export class InterceptorsService {
	private readonly requestInterceptors: InterceptorEntry<RequestInterceptor>[] = [];

	useRequest(interceptor: RequestInterceptor, enabled?: boolean): void {
		this.requestInterceptors.push({
			interceptor,
			enabled: enabled ?? true,
		});
	}

	async executeRequest(config: EnhancedRequestConfig): Promise<EnhancedRequestConfig> {
		let nextConfig = config;
		for (const { interceptor, enabled } of this.requestInterceptors) {
			if (!enabled) continue;
			try {
				nextConfig = await interceptor(nextConfig);
			} catch (error) {
				logger.apiError('Request interceptor error', {
					errorInfo: { message: getErrorMessage(error) },
				});
				throw error;
			}
		}
		return nextConfig;
	}
}

export const authRequestInterceptor: RequestInterceptor = async (
	config: EnhancedRequestConfig
): Promise<EnhancedRequestConfig> => {
	if (config.skipAuth) return config;

	const tokenResult = await storageService.getString(StorageKeys.AUTH_TOKEN);
	const token = tokenResult.success ? tokenResult.data : null;

	if (!token) return config;

	return {
		...config,
		headers: { ...config.headers, Authorization: `Bearer ${token}` },
	};
};
