import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { defaultValidators } from '@shared/constants';
import type { UpdateUserProfileData } from '@shared/types';
import { userService } from '@/services';
import type { RootState } from '@/types';
import { setAvatar } from '@/redux/slices';
import { useAppDispatch } from './useRedux';

/**
 * Hook for updating user profile
 * @returns Mutation for updating user profile data
 */
export const useUpdateUserProfile = () => {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();

	return useMutation({
		mutationFn: (data: UpdateUserProfileData) => userService.updateUserProfile(data),
		onSuccess: profileResponse => {
			// Update avatar ID in Redux if present
			if (profileResponse.profile?.avatar && defaultValidators.number(profileResponse.profile.avatar)) {
				dispatch(setAvatar(profileResponse.profile.avatar));
			}
			// Update query cache directly to ensure immediate UI update
			queryClient.setQueryData(userKeys.profile(), profileResponse);
			// Invalidate user-related queries to ensure fresh data on next fetch
			// This will trigger useCurrentUser to refetch and update Redux via App.tsx
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		},
	});
};

/**
 * Hook for setting user avatar
 * @returns Mutation for setting user avatar
 */
export const useSetAvatar = () => {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();

	return useMutation({
		mutationFn: (avatarId: number) => userService.setAvatar(avatarId),
		onSuccess: profileResponse => {
			// Extract avatar from profile response for Redux
			if (!profileResponse || !profileResponse.profile) {
				// Service already logs validation errors
				return;
			}
			const profile = profileResponse.profile;
			if (profile.avatar && typeof profile.avatar === 'number' && Number.isFinite(profile.avatar)) {
				// Avatar is stored as avatarId (number) in Redux
				dispatch(setAvatar(profile.avatar));
			}
			// Update query cache directly to ensure immediate UI update
			queryClient.setQueryData(userKeys.profile(), profileResponse, { updatedAt: Date.now() });
			// Force refetch to ensure UI updates immediately
			queryClient.refetchQueries({ queryKey: userKeys.profile() });
			// Invalidate user-related queries to ensure fresh data on next fetch
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		},
	});
};

/**
 * Hook for getting user profile
 * @returns Query result with user profile data
 */
export const useUserProfile = () => {
	const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

	return useQuery({
		queryKey: userKeys.profile(),
		queryFn: () => userService.getUserProfile(),
		staleTime: 0, // Always consider stale to allow immediate updates
		enabled: isAuthenticated, // Only fetch if user is authenticated
	});
};

// Query keys
const userKeys = {
	all: ['user'] as const,
	profile: () => [...userKeys.all, 'profile'] as const,
	credits: () => [...userKeys.all, 'credits'] as const,
};
