/**
 * Admin service for EveryTriv client
 * Handles admin operations and user management
 *
 * @module ClientAdminService
 * @description Client-side admin operations
 * @used_by client/src/views/admin, client/src/components/admin, client/src/hooks
 */
import { API_ROUTES, ERROR_MESSAGES, UserStatus, VALID_USER_STATUSES } from '@shared/constants';
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

/**
 * Main admin service class
 * @class ClientAdminService
 * @description Handles all admin operations for the client
 * @used_by client/src/views/admin, client/src/components/admin
 */
class ClientAdminService {
	/**
	 * Update user field
	 * @param field Field name to update
	 * @param value New value for the field
	 * @returns Updated user data
	 * @throws {Error} When update fails
	 */
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
				API_ROUTES.USER.PROFILE_FIELD.replace(':field', field),
				{ value }
			);
			return response.data;
		} catch (error) {
			logger.userError('Failed to update user field', { error: getErrorMessage(error), field });
			throw error;
		}
	}

	/**
	 * Update single preference
	 * @param preference Preference name to update
	 * @param value New value for the preference
	 * @returns Update result
	 * @throws {Error} When update fails
	 */
	async updateSinglePreference(preference: string, value: BasicValue): Promise<unknown> {
		// Validate preference and value
		if (!isNonEmptyString(preference)) {
			throw new Error(VALIDATION_MESSAGES.FIELD_REQUIRED('Preference name'));
		}
		if (!value) {
			throw new Error(VALIDATION_MESSAGES.VALUE_REQUIRED);
		}

		try {
			const response = await apiService.patch(API_ROUTES.USER.PREFERENCES_FIELD.replace(':preference', preference), {
				value,
			});
			return response.data;
		} catch (error) {
			logger.userError('Failed to update single preference', { error: getErrorMessage(error), preference });
			throw error;
		}
	}

	/**
	 * Get user by ID
	 * @param userId User ID
	 * @returns User data
	 * @throws {Error} When retrieval fails
	 */
	async getUserById(userId: string): Promise<unknown> {
		// Validate user ID
		if (!isNonEmptyString(userId)) {
			throw new Error(ERROR_MESSAGES.validation.USER_ID_REQUIRED);
		}

		try {
			const response = await apiService.get<unknown>(API_ROUTES.USER.BY_ID.replace(':id', userId));
			return response.data;
		} catch (error) {
			logger.userError('Failed to get user by ID', { error: getErrorMessage(error), userId });
			throw error;
		}
	}

	/**
	 * Get all users
	 * @param limit Maximum number of users to return
	 * @param offset Pagination offset
	 * @returns List of users
	 * @throws {Error} When retrieval fails
	 */
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
			if (limit != null) searchParams.append('limit', String(limit));
			if (offset != null) searchParams.append('offset', String(offset));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			const response = await apiService.get<UsersListResponse>(`${API_ROUTES.USER.ADMIN.ALL}${query}`);
			return response.data;
		} catch (error) {
			logger.userError('Failed to get all users', { error: getErrorMessage(error), limit, offset });
			throw error;
		}
	}

	/**
	 * Get AI provider statistics
	 * @returns AI provider statistics
	 * @throws {Error} When retrieval fails
	 */
	async getAiProviderStats(): Promise<AiProviderStats> {
		try {
			const response = await apiService.get<AiProviderStats>(API_ROUTES.AI_PROVIDERS.STATS);
			return response.data;
		} catch (error) {
			logger.userError('Failed to get AI provider stats', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Get AI provider health status
	 * @returns AI provider health status
	 * @throws {Error} When retrieval fails
	 */
	async getAiProviderHealth(): Promise<AiProviderHealth> {
		try {
			const response = await apiService.get<AiProviderHealth>(API_ROUTES.AI_PROVIDERS.HEALTH);
			return response.data;
		} catch (error) {
			logger.userError('Failed to get AI provider health status', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Update user credits
	 * @param userId User ID
	 * @param amount Credit amount to add/subtract
	 * @param reason Reason for credit update
	 * @returns Update result
	 * @throws {Error} When update fails
	 */
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
				API_ROUTES.USER.CREDITS_BY_USER_ID.replace(':userId', data.userId),
				{ amount: data.amount, reason: data.reason }
			);
			return response.data;
		} catch (error) {
			logger.userError('Failed to update user credits', {
				error: getErrorMessage(error),
				userId: data.userId,
				amount: data.amount,
			});
			throw error;
		}
	}

	/**
	 * Delete user
	 * @param userId User ID
	 * @returns Deletion result
	 * @throws {Error} When deletion fails
	 */
	async deleteUser(userId: string): Promise<unknown> {
		// Validate user ID
		if (!isNonEmptyString(userId)) {
			throw new Error(ERROR_MESSAGES.validation.USER_ID_REQUIRED);
		}

		try {
			const response = await apiService.delete<unknown>(API_ROUTES.USER.BY_USER_ID.replace(':userId', userId));
			return response.data;
		} catch (error) {
			logger.userError('Failed to delete user', { error: getErrorMessage(error), userId });
			throw error;
		}
	}

	/**
	 * Update user status
	 * @param userId User ID
	 * @param status New status (active, suspended, banned)
	 * @returns Update result
	 * @throws {Error} When update fails
	 */
	async updateUserStatus(userId: string, status: UserStatus): Promise<unknown> {
		// Validate parameters
		if (!userId || userId.trim().length === 0) {
			throw new Error(ERROR_MESSAGES.validation.USER_ID_REQUIRED);
		}
		if (!VALID_USER_STATUSES.includes(status)) {
			throw new Error(VALIDATION_MESSAGES.STATUS_INVALID);
		}

		try {
			const response = await apiService.patch<unknown>(
				API_ROUTES.USER.ADMIN.STATUS_BY_USER_ID.replace(':userId', userId),
				{ status }
			);
			return response.data;
		} catch (error) {
			logger.userError('Failed to update user status', { error: getErrorMessage(error), userId, status });
			throw error;
		}
	}
}

export const adminService = new ClientAdminService();
