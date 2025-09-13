/**
 * User service for EveryTriv client
 * Handles user profile management and user-related operations
 *
 * @module ClientUserServiceModule
 * @description Client-side user profile and preferences management
 * @used_by client/views/user, client/components/user, client/hooks
 */
import { UpdateUserProfileData, User } from '@shared';
import { clientLogger } from '@shared';

import { apiService } from '../api';

/**
 * Main user service class
 * @class UserService
 * @description Handles all user profile operations for the client
 * @used_by client/views/user, client/components/user
 */
class ClientUserService {
  /**
   * Retrieve current user profile information
   * @returns {Promise<User>} Complete user profile data
   * @throws {Error} When profile retrieval fails
   */
  async getUserProfile(): Promise<User> {
    try {
      clientLogger.userInfo('Getting user profile');

      const user = (await apiService.getUserProfile()) as User;

      clientLogger.userInfo('User profile retrieved successfully', { userId: user.id });
      return user;
    } catch (error) {
      clientLogger.userError('Failed to get user profile', { error });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(data: UpdateUserProfileData): Promise<User> {
    try {
      clientLogger.userInfo('Updating user profile', { data });

      const updatedUser = (await apiService.updateUserProfile(
        data as Record<string, unknown>
      )) as User;

      clientLogger.userInfo('User profile updated successfully', { userId: updatedUser.id });
      return updatedUser;
    } catch (error) {
      clientLogger.userError('Failed to update user profile', { error, data });
      throw error;
    }
  }

  /**
   * Get user credits
   */
  async getUserCredits(): Promise<number> {
    try {
      clientLogger.userInfo('Getting user credits');

      const credits = (await apiService.getUserCredits()) as number;

      clientLogger.userInfo('User credits retrieved successfully', { credits });
      return credits;
    } catch (error) {
      clientLogger.userError('Failed to get user credits', { error });
      throw error;
    }
  }

  /**
   * Deduct user credits
   */
  async deductCredits(amount: number): Promise<User> {
    try {
      clientLogger.userInfo('Deducting user credits', { amount });

      const updatedUser = (await apiService.deductCredits(amount)) as User;

      clientLogger.userInfo('User credits deducted successfully', {
        amount,
        newCredits: updatedUser.credits,
      });
      return updatedUser;
    } catch (error) {
      clientLogger.userError('Failed to deduct user credits', { error, amount });
      throw error;
    }
  }
}

export const userService = new ClientUserService();
