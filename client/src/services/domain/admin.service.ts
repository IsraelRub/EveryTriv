/**
 * Admin service for EveryTriv client
 * Handles admin operations and user management
 *
 * @module ClientAdminService
 * @description Client-side admin operations
 * @used_by client/src/views/admin, client/src/components/admin, client/src/hooks
 */
import { API_ROUTES, UserStatus as UserStatusEnum } from '@shared/constants';
import type {
	AiProviderHealth,
	AiProviderStats,
	BasicValue,
	UpdateCreditsData,
	UpdateUserFieldResponse,
	UsersListResponse,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

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
		if (!field || field.trim().length === 0) {
			throw new Error('Field name is required');
		}
		if (!value) {
			throw new Error('Value is required');
		}

		try {
			logger.userInfo('Updating user field', { field });

			const response = await apiService.patch<UpdateUserFieldResponse>(
				API_ROUTES.USER.PROFILE_FIELD.replace(':field', field),
				{ value }
			);

			logger.userInfo('User field updated successfully', { field });
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
		if (!preference || preference.trim().length === 0) {
			throw new Error('Preference name is required');
		}
		if (!value) {
			throw new Error('Value is required');
		}

		try {
			logger.userInfo('Updating single preference', { preference });

			const response = await apiService.patch(API_ROUTES.USER.PREFERENCES_FIELD.replace(':preference', preference), {
				value,
			});

			logger.userInfo('Single preference updated successfully', { preference });
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
		if (!userId || userId.trim().length === 0) {
			throw new Error('User ID is required');
		}

		try {
			logger.userInfo('Getting user by ID', { userId });

			const response = await apiService.get<unknown>(API_ROUTES.USER.BY_ID.replace(':id', userId));

			logger.userInfo('User retrieved successfully', { userId });
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
			throw new Error('Limit must be between 1 and 1000');
		}
		if (offset && offset < 0) {
			throw new Error('Offset must be non-negative');
		}

		try {
			logger.userInfo('Getting all users', { limit, offset });

			const searchParams = new URLSearchParams();
			if (limit != null) searchParams.append('limit', String(limit));
			if (offset != null) searchParams.append('offset', String(offset));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			const response = await apiService.get<UsersListResponse>(`${API_ROUTES.USER.ADMIN.ALL}${query}`);

			logger.userInfo('All users retrieved successfully', {
				count: response.data.users?.length || 0,
			});
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
			logger.userInfo('Getting AI provider stats');

			const response = await apiService.get<AiProviderStats>(API_ROUTES.AI_PROVIDERS.STATS);

			logger.userInfo('AI provider stats retrieved successfully');
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
			logger.userInfo('Getting AI provider health status');

			const response = await apiService.get<AiProviderHealth>(API_ROUTES.AI_PROVIDERS.HEALTH);

			logger.userInfo('AI provider health status retrieved successfully', {
				status: response.data.status,
				availableProviders: response.data.availableProviders,
			});
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
		if (!data.userId || data.userId.trim().length === 0) {
			throw new Error('User ID is required');
		}
		if (data.amount === 0) {
			throw new Error('Amount cannot be zero');
		}
		if (!data.reason || data.reason.trim().length === 0) {
			throw new Error('Reason is required');
		}

		try {
			logger.userInfo('Updating user credits', { userId: data.userId, amount: data.amount, reason: data.reason });

			const response = await apiService.patch<string>(
				API_ROUTES.USER.CREDITS_BY_USER_ID.replace(':userId', data.userId),
				{ amount: data.amount, reason: data.reason }
			);

			logger.userInfo('User credits updated successfully', { userId: data.userId, amount: data.amount });
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
		if (!userId || userId.trim().length === 0) {
			throw new Error('User ID is required');
		}

		try {
			logger.userInfo('Deleting user', { userId });

			const response = await apiService.delete<unknown>(API_ROUTES.USER.BY_USER_ID.replace(':userId', userId));

			logger.userInfo('User deleted successfully', { userId });
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
	async updateUserStatus(
		userId: string,
		status: (typeof UserStatusEnum)[keyof typeof UserStatusEnum]
	): Promise<unknown> {
		// Validate parameters
		if (!userId || userId.trim().length === 0) {
			throw new Error('User ID is required');
		}
		if (!['active', 'suspended', 'banned'].includes(status)) {
			throw new Error('Status must be active, suspended, or banned');
		}

		try {
			logger.userInfo('Updating user status', { userId, status });

			const response = await apiService.patch<unknown>(
				API_ROUTES.USER.ADMIN.STATUS_BY_USER_ID.replace(':userId', userId),
				{ status }
			);

			logger.userInfo('User status updated successfully', { userId, status });
			return response.data;
		} catch (error) {
			logger.userError('Failed to update user status', { error: getErrorMessage(error), userId, status });
			throw error;
		}
	}
}

export const adminService = new ClientAdminService();
