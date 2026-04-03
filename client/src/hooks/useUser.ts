import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UpdateUserProfileData, UserPreferences } from '@shared/types';

import { QUERY_KEYS } from '@/constants';
import { apiService, clientLogger as logger, queryInvalidationService } from '@/services';
import { getAuthCurrentUserQueryKey, profileResponseToBasicUser, readAuthTokenSnapshotForQueryKey } from '@/utils';
import { useIsAuthenticated } from './useAuth';

export const useUpdateUserProfile = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: UpdateUserProfileData) => apiService.updateUserProfile(data),
		onSuccess: async profileResponse => {
			queryClient.setQueryData(QUERY_KEYS.user.profile(), profileResponse);
			queryClient.setQueryData(
				getAuthCurrentUserQueryKey(readAuthTokenSnapshotForQueryKey()),
				profileResponseToBasicUser(profileResponse)
			);
			await queryInvalidationService.invalidateUserQueries(queryClient);
		},
	});
};

export const useSetAvatar = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (avatarId: number) => apiService.setAvatar(avatarId),
		onSuccess: async profileResponse => {
			if (!profileResponse?.profile) {
				return;
			}
			queryClient.setQueryData(QUERY_KEYS.user.profile(), profileResponse, { updatedAt: Date.now() });
			queryClient.setQueryData(
				getAuthCurrentUserQueryKey(readAuthTokenSnapshotForQueryKey()),
				profileResponseToBasicUser(profileResponse)
			);
			await queryInvalidationService.invalidateUserQueries(queryClient);
		},
	});
};

export const useUploadAvatar = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (file: File) => apiService.uploadAvatar(file),
		onSuccess: async profileResponse => {
			if (!profileResponse?.profile) {
				return;
			}
			queryClient.setQueryData(QUERY_KEYS.user.profile(), profileResponse, { updatedAt: Date.now() });
			queryClient.setQueryData(
				getAuthCurrentUserQueryKey(readAuthTokenSnapshotForQueryKey()),
				profileResponseToBasicUser(profileResponse)
			);
			await queryInvalidationService.invalidateUserQueries(queryClient);
		},
	});
};

export const useUserProfile = () => {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: QUERY_KEYS.user.profile(),
		queryFn: () => apiService.getUserProfile(),
		staleTime: 0, // Always consider stale to allow immediate updates
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
