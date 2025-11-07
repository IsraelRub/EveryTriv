/**
 * User service for EveryTriv client
 * Handles user profile management and user-related operations
 *
 * @module ClientUserServiceModule
 * @description Client-side user profile and preferences management
 * @used_by client/src/views/user, client/src/components/user, client/src/hooks
 */
import { BillingCycle, PlanType } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { BasicValue, UpdateUserProfileData, UserPreferences, UserProfileResponseType } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { apiService } from './api.service';

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
	 * Get user credits
	 */
	async getUserCredits(): Promise<number> {
		try {
			logger.userInfo('Getting user credits');

			const credits = await apiService.getUserCredits();

			logger.userInfo('User credits retrieved successfully', { credits });
			return credits;
		} catch (error) {
			logger.userError('Failed to get user credits', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Deduct user credits
	 */
	async deductCredits(amount: number): Promise<{ success: boolean; credits: number }> {
		try {
			logger.userInfo('Deducting user credits', { amount });

			const result = await apiService.deductCredits(amount);

			logger.userInfo('User credits deducted successfully', {
				amount,
				newCredits: result.credits,
			});
			return result;
		} catch (error) {
			logger.userError('Failed to deduct user credits', { error: getErrorMessage(error), amount });
			throw error;
		}
	}

	/**
	 * Delete user account
	 */
	async deleteAccount(): Promise<{ success: boolean; message: string }> {
		try {
			logger.userInfo('Deleting user account');

			const response = await apiService.deleteUserAccount();

			logger.userInfo('User account deleted successfully', {
				success: response.success,
				message: response.message,
			});
			return response;
		} catch (error) {
			logger.userError('Failed to delete user account', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Delete user by ID (Admin)
	 */
	async deleteUser(userId: string): Promise<unknown> {
		try {
			logger.userInfo('Deleting user', { userId });

			const response = await apiService.deleteUser(userId);

			logger.userInfo('User deleted successfully', { userId });
			return response;
		} catch (error) {
			logger.userError('Failed to delete user', { error: getErrorMessage(error), userId });
			throw error;
		}
	}

	/**
	 * Get user by ID (Admin)
	 */
	async getUserById(userId: string): Promise<unknown> {
		try {
			logger.userInfo('Getting user by ID', { userId });

			const response = await apiService.getUserById(userId);

			logger.userInfo('User retrieved successfully', { userId });
			return response;
		} catch (error) {
			logger.userError('Failed to get user by ID', { error: getErrorMessage(error), userId });
			throw error;
		}
	}

	/**
	 * Update user credits (Admin)
	 */
	async updateCredits(userId: string, amount: number, reason: string): Promise<unknown> {
		try {
			logger.userInfo('Updating user credits', { userId, amount, reason });

			const response = await apiService.updateUserCredits(userId, amount, reason);

			logger.userInfo('User credits updated successfully', { userId, amount });
			return response;
		} catch (error) {
			logger.userError('Failed to update user credits', { error: getErrorMessage(error), userId, amount });
			throw error;
		}
	}

	/**
	 * Update user status (Admin)
	 */
	async updateStatus(userId: string, status: 'active' | 'suspended' | 'banned'): Promise<unknown> {
		try {
			logger.userInfo('Updating user status', { userId, status });

			const response = await apiService.updateUserStatus(userId, status);

			logger.userInfo('User status updated successfully', { userId, status });
			return response;
		} catch (error) {
			logger.userError('Failed to update user status', { error: getErrorMessage(error), userId, status });
			throw error;
		}
	}

	/**
	 * Create subscription
	 */
	async createSubscription(plan: PlanType, billingCycle?: BillingCycle): Promise<unknown> {
		try {
			logger.userInfo('Creating subscription', { planType: plan, billingCycle });

			const response = await apiService.createSubscription(plan, billingCycle);

			logger.userInfo('Subscription created successfully', { planType: plan, billingCycle });
			return response;
		} catch (error) {
			logger.userError('Failed to create subscription', {
				error: getErrorMessage(error),
				planType: plan,
				billingCycle,
			});
			throw error;
		}
	}

	/**
	 * Cancel subscription
	 */
	async cancelSubscription(): Promise<{ success: boolean; message: string }> {
		try {
			logger.userInfo('Canceling subscription');

			const response = await apiService.cancelSubscription();

			logger.userInfo('Subscription canceled successfully', {
				success: response.success,
				message: response.message,
			});
			return response;
		} catch (error) {
			logger.userError('Failed to cancel subscription', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Update user field
	 */
	async updateUserField(
		field: string,
		value: import('@shared/types').BasicValue
	): Promise<{ user: import('@shared/types').User }> {
		try {
			logger.userInfo('Updating user field', { field });

			const response = await apiService.updateUserField(field, value);

			logger.userInfo('User field updated successfully', { field });
			return response;
		} catch (error) {
			logger.userError('Failed to update user field', { error: getErrorMessage(error), field });
			throw error;
		}
	}

	/**
	 * Update single preference
	 */
	async updateSinglePreference(preference: string, value: BasicValue): Promise<unknown> {
		try {
			logger.userInfo('Updating user preference', { preference });

			const response = await apiService.updateSinglePreference(preference, value);

			logger.userInfo('User preference updated successfully', { preference });
			return response;
		} catch (error) {
			logger.userError('Failed to update user preference', { error: getErrorMessage(error), preference });
			throw error;
		}
	}

	/**
	 * Update user preferences
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
