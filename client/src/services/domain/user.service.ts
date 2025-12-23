/**
 * User service for EveryTriv client
 * Handles user profile management and user-related operations
 *
 * @module ClientUserServiceModule
 * @description Client-side user profile and preferences management
 * @used_by client/src/views/user, client/src/components/user, client/src/hooks
 */
import { GameMode, UserStatus as UserStatusEnum } from '@shared/constants';
import type {
	BasicUser,
	BasicValue,
	DeductCreditsResponse,
	UpdateCreditsData,
	UpdateUserFieldResponse,
	UpdateUserProfileData,
	UserPreferences,
	UserProfileResponseType,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { adminService, apiService, creditsService, clientLogger as logger } from '@/services';

/**
 * Main user service class
 * @class UserService
 * @description Handles all user profile operations for the client
 * @used_by client/src/views/user, client/src/components/user
 */
class ClientUserService {
	/**
	 * Retrieve current user profile information
	 * @returns {Promise<UserProfileResponseType>} Complete user profile data
	 * @throws {Error} When profile retrieval fails
	 */
	async getUserProfile(): Promise<UserProfileResponseType> {
		try {
			logger.userInfo('Getting user profile');

			const profileResponse = await apiService.getUserProfile();

			logger.userInfo('User profile retrieved successfully');
			return profileResponse;
		} catch (error) {
			logger.userError('Failed to get user profile', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Update user profile
	 * @param data User profile update data
	 * @returns Updated user profile data
	 */
	async updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileResponseType> {
		try {
			logger.userInfo('Updating user profile', { data });

			const profileResponse = await apiService.updateUserProfile(data);

			logger.userInfo('User profile updated successfully');
			return profileResponse;
		} catch (error) {
			logger.userError('Failed to update user profile', { error: getErrorMessage(error), data });
			throw error;
		}
	}

	/**
	 * Set user avatar
	 * @param avatarId Avatar ID (1-10)
	 * @returns Updated user profile data
	 */
	async setAvatar(avatarId: number): Promise<UserProfileResponseType> {
		try {
			logger.userInfo('Setting user avatar', { avatar: avatarId });

			const profileResponse = await apiService.setAvatar(avatarId);

			logger.userInfo('User avatar updated successfully', { avatar: avatarId });
			return profileResponse;
		} catch (error) {
			logger.userError('Failed to set user avatar', { error: getErrorMessage(error), avatar: avatarId });
			throw error;
		}
	}

	/**
	 * Deduct user credits (for admin/user management)
	 * @param amount Amount of credits to deduct
	 * @returns Credit deduction result with updated balance
	 */
	async deductCredits(amount: number): Promise<DeductCreditsResponse> {
		try {
			logger.userInfo('Deducting user credits', { amount });

			// Use game mode for admin credit deduction (QUESTION_LIMITED is the default)
			const result = await creditsService.deductCredits(amount, GameMode.QUESTION_LIMITED);

			logger.userInfo('User credits deducted successfully', {
				amount,
				newCredits: result.totalCredits,
			});
			return {
				success: true,
				credits: result.totalCredits,
				deducted: amount,
			};
		} catch (error) {
			logger.userError('Failed to deduct user credits', { error: getErrorMessage(error), amount });
			throw error;
		}
	}

	/**
	 * Delete user account
	 * @returns Account deletion result
	 */
	async deleteAccount(): Promise<string> {
		try {
			logger.userInfo('Deleting user account');

			const response = await apiService.deleteUserAccount();

			logger.userInfo('User account deleted successfully', {
				message: response,
			});
			return response;
		} catch (error) {
			logger.userError('Failed to delete user account', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Delete user by ID (Admin)
	 * @param userId User identifier to delete
	 * @returns User deletion result
	 */
	async deleteUser(userId: string): Promise<unknown> {
		try {
			logger.userInfo('Deleting user', { userId });

			const response = await adminService.deleteUser(userId);

			logger.userInfo('User deleted successfully', { userId });
			return response;
		} catch (error) {
			logger.userError('Failed to delete user', { error: getErrorMessage(error), userId });
			throw error;
		}
	}

	/**
	 * Get user by ID (Admin)
	 * @param userId User identifier
	 * @returns User data
	 */
	async getUserById(userId: string): Promise<unknown> {
		try {
			logger.userInfo('Getting user by ID', { userId });

			const response = await adminService.getUserById(userId);

			logger.userInfo('User retrieved successfully', { userId });
			return response;
		} catch (error) {
			logger.userError('Failed to get user by ID', { error: getErrorMessage(error), userId });
			throw error;
		}
	}

	/**
	 * Update user credits (Admin)
	 * @param userId User identifier to update
	 * @param amount Credit amount to update
	 * @param reason Reason for credit update
	 * @returns Credit update result
	 */
	async updateCredits(data: UpdateCreditsData): Promise<string> {
		try {
			logger.userInfo('Updating user credits', { userId: data.userId, amount: data.amount, reason: data.reason });

			const response = await adminService.updateUserCredits(data);

			logger.userInfo('User credits updated successfully', { userId: data.userId, amount: data.amount });
			return response;
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
	 * Update user status (Admin)
	 * @param userId User identifier to update
	 * @param status New user status
	 * @returns Status update result
	 */
	async updateStatus(userId: string, status: (typeof UserStatusEnum)[keyof typeof UserStatusEnum]): Promise<unknown> {
		try {
			logger.userInfo('Updating user status', { userId, status });

			const response = await adminService.updateUserStatus(userId, status);

			logger.userInfo('User status updated successfully', { userId, status });
			return response;
		} catch (error) {
			logger.userError('Failed to update user status', { error: getErrorMessage(error), userId, status });
			throw error;
		}
	}

	/**
	 * Search users
	 * @param query Search query string
	 * @param limit Maximum number of results (default: 10)
	 * @returns List of matching users
	 */
	async searchUsers(query: string, limit: number = 10): Promise<BasicUser[]> {
		try {
			logger.userInfo('Searching users', { query, limit });
			const users = await apiService.searchUsers(query, limit);
			logger.userInfo('Users found', { count: users.length });
			return users;
		} catch (error) {
			logger.userError('Failed to search users', { error: getErrorMessage(error), query });
			throw error;
		}
	}

	/**
	 * Update user field
	 * @param field Field name to update
	 * @param value New field value
	 * @returns Updated user data
	 */
	async updateUserField(field: string, value: BasicValue): Promise<UpdateUserFieldResponse> {
		try {
			logger.userInfo('Updating user field', { field });

			const response = await adminService.updateUserField(field, value);

			logger.userInfo('User field updated successfully', { field });
			return response;
		} catch (error) {
			logger.userError('Failed to update user field', { error: getErrorMessage(error), field });
			throw error;
		}
	}

	/**
	 * Update single preference
	 * @param preference Preference name to update
	 * @param value New preference value
	 * @returns Preference update result
	 */
	async updateSinglePreference(preference: string, value: BasicValue): Promise<unknown> {
		try {
			logger.userInfo('Updating user preference', { preference });

			const response = await adminService.updateSinglePreference(preference, value);

			logger.userInfo('User preference updated successfully', { preference });
			return response;
		} catch (error) {
			logger.userError('Failed to update user preference', { error: getErrorMessage(error), preference });
			throw error;
		}
	}

	/**
	 * Update user preferences
	 * @param preferences User preferences data to update
	 * @returns Resolves when preferences are updated
	 */
	async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
		try {
			logger.userInfo('Updating user preferences', { preferences });

			await apiService.updateUserPreferences(preferences);

			logger.userInfo('User preferences updated successfully');
		} catch (error) {
			logger.userError('Failed to update user preferences', { error: getErrorMessage(error), preferences });
			throw error;
		}
	}
}

export const userService = new ClientUserService();
