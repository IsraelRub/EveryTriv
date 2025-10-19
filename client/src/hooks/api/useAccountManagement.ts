/**
 * Account Management Hook
 *
 * @module UseAccountManagement
 * @description React Query hooks for account management functionality
 */
import { clientLogger as logger } from '@shared/services';
import type { UserWithSubscription } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { setAuthenticated, setUser } from '../../redux/slices/userSlice';
import { apiService } from '../../services/api';
import type { RootState } from '../../types/redux/state.types';
import { useAppDispatch } from '../layers/utils';
import { authKeys } from './useAuth';

// Helper function to invalidate user-related queries consistently
const invalidateUserQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
  queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
};

/**
 * Hook for deleting user account
 * @returns Mutation for deleting user account
 */
export const useDeleteUserAccount = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async () => {
      logger.userInfo('Deleting user account');
      return apiService.deleteUserAccount();
    },
    onSuccess: data => {
      // Update Redux state for HOCs consistency
      dispatch(setAuthenticated(false));
      dispatch(setUser(null));

      // Clear all user-related queries
      queryClient.clear();
      logger.userInfo('User account deleted successfully', {
        success: data.success,
        message: data.message,
      });
    },
    onError: error => {
      logger.userError('Failed to delete user account', { error });
    },
  });
};

/**
 * Hook for updating user field
 * @returns Mutation for updating user field
 */
export const useUpdateUserField = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  return useMutation({
    mutationFn: async ({ field, value }: { field: string; value: unknown }) => {
      logger.userInfo('Updating user field', { field });
      return apiService.updateUserField(field, value);
    },
    onSuccess: (data, { field, value }) => {
      // Update Redux state for HOCs consistency
      if (
        data &&
        typeof data === 'object' &&
        'user' in data &&
        (data as { user: UserWithSubscription }).user &&
        user
      ) {
        dispatch(setUser({ ...user, [field]: value }));
      }

      // Invalidate user profile queries with consistent keys
      invalidateUserQueries(queryClient);
      logger.userInfo('User field updated successfully', { field });
    },
    onError: (error, { field }) => {
      logger.userError('Failed to update user field', { error, field });
    },
  });
};

/**
 * Hook for updating single preference
 * @returns Mutation for updating single preference
 */
export const useUpdateSinglePreference = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  return useMutation({
    mutationFn: async ({ preference, value }: { preference: string; value: unknown }) => {
      logger.userInfo('Updating user preference', { preference });
      return apiService.updateSinglePreference(preference, value);
    },
    onSuccess: (data, { preference, value }) => {
      // Update Redux state for HOCs consistency
      if (
        data &&
        typeof data === 'object' &&
        'user' in data &&
        (data as { user: UserWithSubscription }).user &&
        user
      ) {
        dispatch(setUser({ ...user, preferences: { ...user.preferences, [preference]: value } }));
      }

      // Invalidate user profile queries with consistent keys
      invalidateUserQueries(queryClient);
      logger.userInfo('User preference updated successfully', { preference });
    },
    onError: (error, { preference }) => {
      logger.userError('Failed to update user preference', { error, preference });
    },
  });
};

/**
 * Hook for Google OAuth login
 * @returns Mutation for Google OAuth login
 */
export const useGoogleOAuth = () => {
  return useMutation({
    mutationFn: async () => {
      logger.userInfo('Initiating Google OAuth login');
      // Redirect to Google OAuth endpoint
      window.location.href = '/api/auth/google';
    },
    onSuccess: () => {
      logger.userInfo('Google OAuth redirect initiated');
    },
    onError: error => {
      logger.userError('Failed to initiate Google OAuth', { error });
    },
  });
};

/**
 * Hook for Google OAuth callback
 * @returns Mutation for Google OAuth callback
 */
export const useGoogleOAuthCallback = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (code: string) => {
      logger.userInfo('Processing Google OAuth callback', { code });
      // This would call the callback endpoint with the code
      return apiService.get(`/auth/google/callback?code=${code}`);
    },
    onSuccess: data => {
      // Update Redux state for HOCs consistency
      if (data && typeof data === 'object' && 'user' in data) {
        dispatch(setAuthenticated(true));
        const userData = (data as { user: UserWithSubscription }).user;
        dispatch(setUser(userData));
      }

      // Invalidate auth queries with consistent keys
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      logger.userInfo('Google OAuth callback processed successfully');
    },
    onError: error => {
      logger.userError('Failed to process Google OAuth callback', { error });
    },
  });
};

/**
 * Hook for updating user credits (Admin)
 * @returns Mutation for updating user credits
 */
export const useUpdateUserCredits = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  return useMutation({
    mutationFn: async ({
      userId,
      amount,
      reason,
    }: {
      userId: string;
      amount: number;
      reason: string;
    }) => {
      logger.userInfo('Admin updating user credits', { userId, amount, reason });
      return apiService.updateUserCredits(userId, amount, reason);
    },
    onSuccess: (data, { userId }) => {
      // Update Redux state if updating current user
      if (
        user &&
        user.id === userId &&
        data &&
        typeof data === 'object' &&
        'user' in data &&
        (data as { user: UserWithSubscription }).user
      ) {
        const userData = (data as { user: UserWithSubscription }).user;
        dispatch(setUser(userData));
      }

      // Invalidate user queries with consistent keys
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      logger.userInfo('User credits updated successfully', { userId });
    },
    onError: (error, { userId }) => {
      logger.userError('Failed to update user credits', { error, userId });
    },
  });
};

/**
 * Hook for updating user status (Admin)
 * @returns Mutation for updating user status
 */
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  return useMutation({
    mutationFn: async ({
      userId,
      status,
    }: {
      userId: string;
      status: 'active' | 'suspended' | 'banned';
    }) => {
      logger.userInfo('Admin updating user status', { userId, status });
      return apiService.updateUserStatus(userId, status);
    },
    onSuccess: (data, { userId }) => {
      // Update Redux state if updating current user
      if (
        user &&
        user.id === userId &&
        data &&
        typeof data === 'object' &&
        'user' in data &&
        (data as { user: UserWithSubscription }).user
      ) {
        const userData = (data as { user: UserWithSubscription }).user;
        dispatch(setUser(userData));
      }

      // Invalidate user queries with consistent keys
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      logger.userInfo('User status updated successfully', { userId });
    },
    onError: (error, { userId }) => {
      logger.userError('Failed to update user status', { error, userId });
    },
  });
};

/**
 * Hook for deleting user (Admin)
 * @returns Mutation for deleting user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  return useMutation({
    mutationFn: async (userId: string) => {
      logger.userInfo('Admin deleting user', { userId });
      return apiService.deleteUser(userId);
    },
    onSuccess: (_, userId) => {
      // Update Redux state if deleting current user
      if (user?.id === userId) {
        dispatch(setAuthenticated(false));
        dispatch(setUser(null));
      }

      // Invalidate all user-related queries with consistent keys
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });
      logger.userInfo('User deleted successfully', { userId });
    },
    onError: (error, userId) => {
      logger.userError('Failed to delete user', { error, userId });
    },
  });
};

/**
 * Hook for getting user by ID (Admin)
 * @returns Query for getting user by ID
 */
export const useGetUserById = () => {
  return useMutation({
    mutationFn: async (userId: string) => {
      logger.userInfo('Admin fetching user by ID', { userId });
      return apiService.getUserById(userId);
    },
    onSuccess: (_, userId) => {
      logger.userInfo('User fetched successfully', { userId });
    },
    onError: (error, userId) => {
      logger.userError('Failed to fetch user', { error, userId });
    },
  });
};
