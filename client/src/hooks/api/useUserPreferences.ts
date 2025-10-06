/**
 * User Preferences Hook
 *
 * @module UseUserPreferences
 * @description React Query hooks for user preferences management
 */
import { mergeWithDefaults, UserPreferencesUpdate } from '@shared';
import { clientLogger as logger } from '@shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { setUser } from '../../redux/slices/userSlice';
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
 * Hook for getting user preferences
 * @returns Query result with user preferences
 */
export const useUserPreferences = () => {
  return useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      logger.userInfo('Fetching user preferences');
      // Since there's no getUserPreferences endpoint, return default preferences
      const defaultPreferences = mergeWithDefaults(null);
      logger.userInfo('User preferences fetched successfully', {
        hasPreferences: !!defaultPreferences,
      });
      return defaultPreferences;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - preferences don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook for updating user preferences
 * @returns Mutation for updating user preferences
 */
export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  return useMutation({
    mutationFn: async (preferences: UserPreferencesUpdate) => {
      logger.userInfo('Updating user preferences', { preferences });
      return apiService.updateUserPreferences(preferences);
    },
    onSuccess: () => {
      // Update Redux state for HOCs consistency
      if (user) {
        // Update user preferences in Redux state
        dispatch(setUser({ ...user }));
      }

      // Invalidate queries with consistent keys
      invalidateUserQueries(queryClient);
      logger.userInfo('User preferences updated successfully');
    },
    onError: error => {
      logger.userError('Failed to update user preferences', { error });
    },
  });
};
