import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UpdateUserProfileData, UserPreferences } from '@shared/types';

import { QUERY_KEYS } from '@/constants';
import { clientLogger as logger, queryInvalidationService, userService } from '@/services';
import { useIsAuthenticated } from './useAuth';

export const useUpdateUserProfile = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: UpdateUserProfileData) => userService.updateUserProfile(data),
		onSuccess: profileResponse => {
			// Update query cache directly to ensure immediate UI update
			queryClient.setQueryData(QUERY_KEYS.user.profile(), profileResponse);
			// Invalidate user-related queries to ensure fresh data on next fetch
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.all });
			// Also invalidate auth query to update current user
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
		},
	});
};

export const useSetAvatar = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (avatarId: number) => userService.setAvatar(avatarId),
		onSuccess: profileResponse => {
			if (!profileResponse?.profile) {
				// Service already logs validation errors
				return;
			}
			// Update query cache directly to ensure immediate UI update
			queryClient.setQueryData(QUERY_KEYS.user.profile(), profileResponse, { updatedAt: Date.now() });
			// Force refetch to ensure UI updates immediately
			queryClient.refetchQueries({ queryKey: QUERY_KEYS.user.profile() });
			// Invalidate user-related queries to ensure fresh data on next fetch
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.all });
			// Also invalidate auth query to update current user
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
		},
	});
};

export const useUserProfile = () => {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: QUERY_KEYS.user.profile(),
		queryFn: () => userService.getUserProfile(),
		staleTime: 0, // Always consider stale to allow immediate updates
		enabled: isAuthenticated, // Only fetch if user is authenticated
	});
};

export const useUpdateUserPreferences = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (preferences: Partial<UserPreferences>) => userService.updateUserPreferences(preferences),
		onSuccess: () => {
			// Invalidate current user query to refresh user data with updated preferences
			// This ensures Redux state is updated via App.tsx useEffect that syncs with useCurrentUser
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.currentUser() });

			// Invalidate queries with consistent keys
			queryInvalidationService.invalidateUserQueries(queryClient);
			logger.userInfo('User preferences updated successfully');
		},
	});
};
