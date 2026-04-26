import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { TIME_PERIODS_MS } from '@shared/constants';
import type { UpdateUserProfileData, UserPreferences } from '@shared/types';

import { QUERY_KEYS } from '@/constants';
import { apiService, clientLogger as logger, queryInvalidationService } from '@/services';
import { useIsAuthenticated } from './useAuth';

export const useUpdateUserProfile = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: UpdateUserProfileData) => apiService.updateUserProfile(data),
		onSuccess: async profileResponse => {
			await queryInvalidationService.syncUserProfileResponseFromMutation(queryClient, profileResponse);
		},
	});
};

export const useSetAvatar = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (avatarId: number) => apiService.setAvatar(avatarId),
		onSuccess: async profileResponse => {
			await queryInvalidationService.syncUserProfileResponseFromMutation(queryClient, profileResponse);
		},
	});
};

export const useUploadAvatar = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (file: File) => apiService.uploadAvatar(file),
		onSuccess: async profileResponse => {
			await queryInvalidationService.syncUserProfileResponseFromMutation(queryClient, profileResponse);
		},
	});
};

export const useUserProfile = () => {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: QUERY_KEYS.user.profile(),
		queryFn: () => apiService.getUserProfile(),
		// Mutations update this query via setQueryData; a short stale window avoids refetch-on-mount
		// immediately overwriting fresh cache while still allowing periodic refresh.
		staleTime: TIME_PERIODS_MS.MINUTE,
		enabled: isAuthenticated, // Only fetch if user is authenticated
	});
};

export const useUpdateUserPreferences = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (preferences: Partial<UserPreferences>) => apiService.updateUserPreferences(preferences),
		onSuccess: async () => {
			await queryInvalidationService.invalidateUserQueries(queryClient);
			logger.userInfo('User preferences updated successfully');
		},
	});
};
