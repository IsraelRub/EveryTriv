/**
 * User Preferences Hook
 *
 * @module UseUserPreferences
 * @description React Query hooks for user preferences management
 */
import { useSelector } from 'react-redux';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clientLogger as logger } from '@shared/services';
import type { UserPreferences } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { setUser } from '../redux/slices';
import { userService } from '../services';
import type { RootState } from '../types';
import { authKeys } from './useAuth';
import { useAppDispatch } from './useRedux';

// Helper function to invalidate user-related queries consistently
const invalidateUserQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
	queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
	queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
	queryClient.invalidateQueries({ queryKey: ['userProfile'] });
	queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
};

/**
 * Hook for updating user preferences
 * @returns Mutation for updating user preferences
 */
export const useUpdateUserPreferences = () => {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();
	const { currentUser } = useSelector((state: RootState) => state.user);

	return useMutation({
		mutationFn: async (preferences: Partial<UserPreferences>) => {
			logger.userInfo('Updating user preferences');
			return userService.updateUserPreferences(preferences);
		},
		onSuccess: () => {
			// Update Redux state for HOCs consistency
			if (currentUser) {
				// Update user preferences in Redux state
				dispatch(setUser({ ...currentUser }));
			}

			// Invalidate queries with consistent keys
			invalidateUserQueries(queryClient);
			logger.userInfo('User preferences updated successfully');
		},
		onError: error => {
			logger.userError('Failed to update user preferences', { error: getErrorMessage(error) });
		},
	});
};
