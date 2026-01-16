import { API_ENDPOINTS, ERROR_MESSAGES, QUERY_PARAMS, UserStatus, VALID_USER_STATUSES_SET } from '@shared/constants';
import type {
	AiProviderHealth,
	AiProviderStats,
	BasicValue,
	UpdateCreditsData,
	UpdateUserFieldResponse,
	UsersListResponse,
} from '@shared/types';
import { getErrorMessage, isNonEmptyString } from '@shared/utils';

import { VALIDATION_MESSAGES } from '@/constants';
import { apiService, clientLogger as logger } from '@/services';

class AdminService {
	async updateUserField(field: string, value: BasicValue): Promise<UpdateUserFieldResponse> {
		// Validate field and value
		if (!isNonEmptyString(field)) {
			throw new Error(ERROR_MESSAGES.validation.FIELD_NAME_REQUIRED);
		}
		if (!value) {
			throw new Error(VALIDATION_MESSAGES.VALUE_REQUIRED);
		}

		try {
			const response = await apiService.patch<UpdateUserFieldResponse>(
				API_ENDPOINTS.USER.PROFILE_FIELD.replace(':field', field),
				{ value }
			);
			return response.data;
		} catch (error) {
			logger.userError('Failed to update user field', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async updateSinglePreference(preference: string, value: BasicValue): Promise<unknown> {
		// Validate preference and value
		if (!isNonEmptyString(preference)) {
			throw new Error(VALIDATION_MESSAGES.FIELD_REQUIRED('Preference name'));
		}
		if (!value) {
			throw new Error(VALIDATION_MESSAGES.VALUE_REQUIRED);
		}

		try {
			const response = await apiService.patch(API_ENDPOINTS.USER.PREFERENCES_FIELD.replace(':preference', preference), {
				value,
			});
			return response.data;
		} catch (error) {
			logger.userError('Failed to update single preference', {
				errorInfo: { message: getErrorMessage(error) },
				preference,
			});
			throw error;
		}
	}

	async getUserById(userId: string): Promise<unknown> {
		// Validate user ID
		if (!isNonEmptyString(userId)) {
			throw new Error(ERROR_MESSAGES.validation.USER_ID_REQUIRED);
		}

		try {
			const response = await apiService.get<unknown>(API_ENDPOINTS.USER.BY_ID.replace(':id', userId));
			return response.data;
		} catch (error) {
			logger.userError('Failed to get user by ID', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async getAllUsers(limit?: number, offset?: number): Promise<UsersListResponse> {
		// Validate pagination parameters
		if (limit && (limit < 1 || limit > 1000)) {
			throw new Error(VALIDATION_MESSAGES.LIMIT_RANGE(1, 1000));
		}
		if (offset && offset < 0) {
			throw new Error(VALIDATION_MESSAGES.OFFSET_NON_NEGATIVE);
		}

		try {
			const searchParams = new URLSearchParams();
			if (limit != null) searchParams.append(QUERY_PARAMS.LIMIT, String(limit));
			if (offset != null) searchParams.append(QUERY_PARAMS.OFFSET, String(offset));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			const response = await apiService.get<UsersListResponse>(`${API_ENDPOINTS.USER.ADMIN.ALL}${query}`);
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

	async updateUserCredits(data: UpdateCreditsData): Promise<string> {
		// Validate parameters
		if (!isNonEmptyString(data.userId)) {
			throw new Error(ERROR_MESSAGES.validation.USER_ID_REQUIRED);
		}
		if (data.amount === 0) {
			throw new Error(VALIDATION_MESSAGES.VALUE_REQUIRED);
		}
		if (!isNonEmptyString(data.reason)) {
			throw new Error(VALIDATION_MESSAGES.REASON_REQUIRED);
		}

		try {
			const response = await apiService.patch<string>(
				API_ENDPOINTS.USER.CREDITS_BY_USER_ID.replace(':userId', data.userId),
				{ amount: data.amount, reason: data.reason }
			);
			return response.data;
		} catch (error) {
			logger.userError('Failed to update user credits', {
				errorInfo: { message: getErrorMessage(error) },
				userId: data.userId,
				amount: data.amount,
			});
			throw error;
		}
	}

	async deleteUser(userId: string): Promise<unknown> {
		// Validate user ID
		if (!isNonEmptyString(userId)) {
			throw new Error(ERROR_MESSAGES.validation.USER_ID_REQUIRED);
		}

		try {
			const response = await apiService.delete<unknown>(API_ENDPOINTS.USER.BY_USER_ID.replace(':userId', userId));
			return response.data;
		} catch (error) {
			logger.userError('Failed to delete user', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async updateUserStatus(userId: string, status: UserStatus): Promise<unknown> {
		// Validate parameters
		if (!userId || userId.trim().length === 0) {
			throw new Error(ERROR_MESSAGES.validation.USER_ID_REQUIRED);
		}
		if (!VALID_USER_STATUSES_SET.has(status)) {
			throw new Error(VALIDATION_MESSAGES.STATUS_INVALID);
		}

		try {
			const response = await apiService.patch<unknown>(
				API_ENDPOINTS.USER.ADMIN.STATUS_BY_USER_ID.replace(':userId', userId),
				{ status }
			);
			return response.data;
		} catch (error) {
			logger.userError('Failed to update user status', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				status,
			});
			throw error;
		}
	}
}

export const adminService = new AdminService();
