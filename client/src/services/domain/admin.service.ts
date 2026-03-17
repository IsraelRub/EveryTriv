import { API_ENDPOINTS, QUERY_PARAMS } from '@shared/constants';
import type { AiProviderHealth, AiProviderStats, UsersListResponse } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import type { AdminPricingResponse, AdminPricingUpdatePayload } from '@/types';
import { apiService, clientLogger as logger } from '@/services';
import { validateListQueryParams } from '@/utils';

class AdminService {
	async getAllUsers(limit?: number, offset?: number): Promise<UsersListResponse> {
		validateListQueryParams(limit, offset);

		try {
			const searchParams = new URLSearchParams();
			if (limit != null) searchParams.append(QUERY_PARAMS.LIMIT, String(limit));
			if (offset != null) searchParams.append(QUERY_PARAMS.OFFSET, String(offset));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			const response = await apiService.get<UsersListResponse>(API_ENDPOINTS.USER.ADMIN.ALL + query);
			return response.data;
		} catch (error) {
			logger.userError('Failed to get all users', {
				errorInfo: { message: getErrorMessage(error) },
				limit,
				offset,
			});
			throw error;
		}
	}

	async getAiProviderStats(): Promise<AiProviderStats> {
		try {
			const response = await apiService.get<AiProviderStats>(API_ENDPOINTS.AI_PROVIDERS.STATS);
			return response.data;
		} catch (error) {
			logger.userError('Failed to get AI provider stats', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getAiProviderHealth(): Promise<AiProviderHealth> {
		try {
			const response = await apiService.get<AiProviderHealth>(API_ENDPOINTS.AI_PROVIDERS.HEALTH);
			return response.data;
		} catch (error) {
			logger.userError('Failed to get AI provider health status', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getAdminPricing(): Promise<AdminPricingResponse> {
		try {
			const response = await apiService.get<AdminPricingResponse>(API_ENDPOINTS.ADMIN.PRICING);
			return response.data;
		} catch (error) {
			logger.userError('Failed to get admin pricing', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async updateAdminPricing(payload: AdminPricingUpdatePayload): Promise<{ success: boolean }> {
		try {
			const response = await apiService.put<{ success: boolean }>(API_ENDPOINTS.ADMIN.PRICING, payload);
			return response.data;
		} catch (error) {
			logger.userError('Failed to update admin pricing', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}
}

export const adminService = new AdminService();
