import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BasicUser, UpdateUserProfileData } from '@shared/types';

import { updateUserProfile } from '../redux/slices';
import { userService } from '../services';
import { useAppDispatch } from './useRedux';

// Mutations
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
				username: profile.username,
				email: profile.email,
				role: profile.role,
			};
			dispatch(updateUserProfile(userData));
			// Invalidate user-related queries
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		},
	});
};

export const useUserProfile = () => {
	return useQuery({
		queryKey: userKeys.profile(),
		queryFn: () => userService.getUserProfile(),
		staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
	});
};

// Query keys
const userKeys = {
	all: ['user'] as const,
	profile: () => [...userKeys.all, 'profile'] as const,
	credits: () => [...userKeys.all, 'credits'] as const,
};
