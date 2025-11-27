import { useSelector } from 'react-redux';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BasicUser, UpdateUserProfileData } from '@shared/types';

import { updateUserProfile } from '../redux/slices';
import { userService } from '../services';
import type { RootState } from '../types';
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
			// Extract user data from profile response for Redux
			const profile = profileResponse.profile;
			const userData: Partial<BasicUser> = {
				id: profile.id,
				email: profile.email,
				role: profile.role,
			};
			dispatch(updateUserProfile(userData));
			// Invalidate user-related queries
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
		staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
		enabled: isAuthenticated, // Only fetch if user is authenticated
	});
};

// Query keys
const userKeys = {
	all: ['user'] as const,
	profile: () => [...userKeys.all, 'profile'] as const,
	credits: () => [...userKeys.all, 'credits'] as const,
};
