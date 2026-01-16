import type { UpdateUserProfileData, UserPreferences, UserProfileResponseType } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { apiService, clientLogger as logger } from '@/services';

class UserService {
	async getUserProfile(): Promise<UserProfileResponseType> {
		try {
			return await apiService.getUserProfile();
		} catch (error) {
			logger.userError('Failed to get user profile', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileResponseType> {
		try {
			logger.userInfo('Updating user profile');
			const result = await apiService.updateUserProfile(data);
			logger.userInfo('User profile updated successfully');
			return result;
		} catch (error) {
			const logData: Record<string, unknown> = {
				...(data.firstName !== undefined && { firstName: data.firstName }),
				...(data.lastName !== undefined && { lastName: data.lastName }),
				...(data.avatar !== undefined && { avatar: data.avatar }),
				...(data.preferences !== undefined && { preferences: data.preferences }),
			};
			logger.userError('Failed to update user profile', {
				errorInfo: { message: getErrorMessage(error) },
				data: logData,
			});
			throw error;
		}
	}

	async setAvatar(avatarId: number): Promise<UserProfileResponseType> {
		try {
			logger.userInfo('Setting user avatar', { avatar: avatarId });
			const result = await apiService.setAvatar(avatarId);
			logger.userInfo('User avatar set successfully', { avatar: avatarId });
			return result;
		} catch (error) {
			logger.userError('Failed to set user avatar', {
				errorInfo: { message: getErrorMessage(error) },
				avatar: avatarId,
			});
			throw error;
		}
	}

	async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
		try {
			logger.userInfo('Updating user preferences');
			await apiService.updateUserPreferences(preferences);
			logger.userInfo('User preferences updated successfully');
		} catch (error) {
			logger.userError('Failed to update user preferences', {
				errorInfo: { message: getErrorMessage(error) },
				preferences,
			});
			throw error;
		}
	}
}

export const userService = new UserService();
