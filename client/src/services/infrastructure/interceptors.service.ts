import type { ApiError, ApiResponse } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { STORAGE_KEYS } from '@/constants';
import { clientLogger as logger, storageService } from '@/services';
import type {
	EnhancedRequestConfig,
	ErrorInterceptor,
	InterceptorOptions,
	RequestInterceptor,
	ResponseInterceptor,
	SimpleInterceptor,
} from '@/types';

export class InterceptorsService {
	private readonly requestInterceptors: SimpleInterceptor<RequestInterceptor>[] = [];
	private readonly responseInterceptors: SimpleInterceptor<ResponseInterceptor>[] = [];
	private readonly errorInterceptors: SimpleInterceptor<ErrorInterceptor>[] = [];

	useRequest(interceptor: RequestInterceptor, options?: InterceptorOptions): void {
		this.requestInterceptors.push({
			interceptor,
			enabled: options?.enabled ?? true,
		});
	}

	useResponse(interceptor: ResponseInterceptor, options?: InterceptorOptions): void {
		this.responseInterceptors.push({
			interceptor,
			enabled: options?.enabled ?? true,
		});
	}

	useError(interceptor: ErrorInterceptor, options?: InterceptorOptions): void {
		this.errorInterceptors.push({
			interceptor,
			enabled: options?.enabled ?? true,
		});
	}

	async executeRequest(config: EnhancedRequestConfig): Promise<EnhancedRequestConfig> {
		let value = config;
		for (const { interceptor, enabled } of this.requestInterceptors) {
			if (!enabled) continue;
			try {
				value = await interceptor(value);
			} catch (error) {
				logger.apiError('Request interceptor error', {
					errorInfo: { message: getErrorMessage(error) },
				});
				throw error;
			}
		}
		return value;
	}

	async executeResponse<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
		let value = response;
		for (const { interceptor, enabled } of this.responseInterceptors) {
			if (!enabled) continue;
			try {
				value = await interceptor<T>(value);
			} catch (error) {
				logger.apiError('Response interceptor error', {
					errorInfo: { message: getErrorMessage(error) },
				});
				throw error;
			}
		}
		return value;
	}

	async executeError(error: ApiError): Promise<ApiError> {
		let value = error;
		for (const { interceptor, enabled } of this.errorInterceptors) {
			if (!enabled) continue;
			try {
				value = await interceptor(value);
			} catch (err) {
				logger.apiError('Error interceptor error', {
					errorInfo: { message: getErrorMessage(err) },
				});
			}
		}
		return value;
	}
}

export const authRequestInterceptor: RequestInterceptor = async (
	config: EnhancedRequestConfig
): Promise<EnhancedRequestConfig> => {
	if (config.skipAuth) return config;

	const tokenResult = await storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
	const token = tokenResult.success ? tokenResult.data : null;

	if (!token) return config;

	return {
		...config,
		headers: { ...config.headers, Authorization: `Bearer ${token}` },
	};
};
