import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UpdateUserProfileData } from 'everytriv-shared/types';

import { userService } from '../../services';

export const useDeductCredits = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (amount: number) => userService.deductCredits(amount),
		onSuccess: () => {
			// Invalidate credits query
			queryClient.invalidateQueries({ queryKey: userKeys.credits() });
		},
	});
};

// Mutations
export const useUpdateUserProfile = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: UpdateUserProfileData) => userService.updateUserProfile(data),
		onSuccess: () => {
			// Invalidate user-related queries
			queryClient.invalidateQueries({ queryKey: userKeys.all });
		},
	});
};

export const useUserCredits = () => {
	return useQuery({
		queryKey: userKeys.credits(),
		queryFn: () => userService.getUserCredits(),
		staleTime: 30 * 1000, // Consider stale after 30 seconds
	});
};

// Hooks
export const useUserProfile = () => {
	return useQuery({
		queryKey: userKeys.profile(),
		queryFn: () => userService.getUserProfile(),
		staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
	});
};

// Query keys
export const userKeys = {
	all: ['user'] as const,
	profile: () => [...userKeys.all, 'profile'] as const,
	credits: () => [...userKeys.all, 'credits'] as const,
};
