import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authService, logger } from '../../services';
import type { ExtendedUserProfileUpdateRequest, UserLoginRequest, UserRegisterRequest } from '../../types';

// Query keys
export const authKeys = {
	all: ['auth'] as const,
	currentUser: () => [...authKeys.all, 'current-user'] as const,
};

// Hooks
export const useCurrentUser = () => {
	return useQuery({
		queryKey: authKeys.currentUser(),
		queryFn: () => authService.getCurrentUser(),
		staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
		enabled: authService.isAuthenticated(), // Only run if authenticated
	});
};

// Mutations
export const useLogin = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (credentials: UserLoginRequest) =>
			authService.login({
				username: credentials.email, // Use email as username
				email: credentials.email,
				password: credentials.password,
			}),
		onSuccess: () => {
			// Invalidate auth-related queries
			queryClient.invalidateQueries({ queryKey: authKeys.all });
			// Clear any cached data that might be user-specific
			queryClient.clear();
		},
	});
};

export const useLogout = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => authService.logout(),
		onSuccess: () => {
			// Clear all cached data on logout
			queryClient.clear();
			logger.securityLogout('User logged out, cache cleared');
		},
		onError: error => {
			// Even if logout fails, clear the cache for security
			queryClient.clear();
			logger.securityLogout('Logout failed, but cache cleared for security', { error });
		},
	});
};

export const useRefreshToken = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => authService.refreshToken(),
		onSuccess: () => {
			// Invalidate auth-related queries
			queryClient.invalidateQueries({ queryKey: authKeys.all });
		},
	});
};

export const useRegister = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (credentials: UserRegisterRequest) => authService.register(credentials),
		onSuccess: () => {
			// Invalidate auth-related queries
			queryClient.invalidateQueries({ queryKey: authKeys.all });
			// Clear any cached data that might be user-specific
			queryClient.clear();
		},
	});
};

export const useUpdateProfile = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: ExtendedUserProfileUpdateRequest) => authService.updateProfile(data),
		onSuccess: () => {
			// Invalidate current user query
			queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
		},
	});
};
