/**
 * User service for EveryTriv client
 * Handles user profile management and user-related operations
 *
 * @module ClientUserServiceModule
 * @description Client-side user profile and preferences management
 * @used_by client/src/views/user, client/src/components/user, client/src/hooks
 */
import type {
	UpdateUserProfileData,
	UserPreferences,
	UserProfileResponseType,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { apiService, clientLogger as logger } from '@/services';

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
			return await apiService.getUserProfile();
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
			logger.userInfo('Updating user profile');
			const result = await apiService.updateUserProfile(data);
			logger.userInfo('User profile updated successfully');
			return result;
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
			const result = await apiService.setAvatar(avatarId);
			logger.userInfo('User avatar set successfully', { avatar: avatarId });
			return result;
		} catch (error) {
			logger.userError('Failed to set user avatar', { error: getErrorMessage(error), avatar: avatarId });
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
			logger.userInfo('Updating user preferences');
			await apiService.updateUserPreferences(preferences);
			logger.userInfo('User preferences updated successfully');
		} catch (error) {
			logger.userError('Failed to update user preferences', { error: getErrorMessage(error), preferences });
			throw error;
		}
	}
}

export const userService = new ClientUserService();
