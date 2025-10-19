/**
 * User service for EveryTriv client
 * Handles user profile management and user-related operations
 *
 * @module ClientUserServiceModule
 * @description Client-side user profile and preferences management
 * @used_by client/src/views/user, client/src/components/user, client/src/hooks
 */
import { clientLogger as logger } from '@shared/services';
import type { UpdateUserProfileData, User } from '@shared/types';

import { apiService } from '../api';

/**
 * Main user service class
 * @class UserService
 * @description Handles all user profile operations for the client
 * @used_by client/src/views/user, client/src/components/user
 */
class ClientUserService {
  /**
   * Retrieve current user profile information
   * @returns {Promise<User>} Complete user profile data
   * @throws {Error} When profile retrieval fails
   */
  async getUserProfile(): Promise<User> {
    try {
      logger.userInfo('Getting user profile');

      const user = (await apiService.getUserProfile()) as User;

      logger.userInfo('User profile retrieved successfully', { userId: user.id });
      return user;
    } catch (error) {
      logger.userError('Failed to get user profile', { error });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(data: UpdateUserProfileData): Promise<User> {
    try {
      logger.userInfo('Updating user profile', { data });

      const updatedUser = (await apiService.updateUserProfile(
        data as Record<string, unknown>
      )) as User;

      logger.userInfo('User profile updated successfully', { userId: updatedUser.id });
      return updatedUser;
    } catch (error) {
      logger.userError('Failed to update user profile', { error, data });
      throw error;
    }
  }

  /**
   * Get user credits
   */
  async getUserCredits(): Promise<number> {
    try {
      logger.userInfo('Getting user credits');

      const credits = (await apiService.getUserCredits()) as number;

      logger.userInfo('User credits retrieved successfully', { credits });
      return credits;
    } catch (error) {
      logger.userError('Failed to get user credits', { error });
      throw error;
    }
  }

  /**
   * Deduct user credits
   */
  async deductCredits(amount: number): Promise<User> {
    try {
      logger.userInfo('Deducting user credits', { amount });

      const updatedUser = (await apiService.deductCredits(amount)) as User;

      logger.userInfo('User credits deducted successfully', {
        amount,
        newCredits: updatedUser.credits,
      });
      return updatedUser;
    } catch (error) {
      logger.userError('Failed to deduct user credits', { error, amount });
      throw error;
    }
  }
}

export const userService = new ClientUserService();
