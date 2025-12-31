import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { TIME_PERIODS_MS } from '@shared/constants';
import { authService, clientLogger as logger } from '@/services';
import type { RootState, UserLoginRequest, UserRegisterRequest } from '@/types';
import { setUser } from '@/redux/slices';
import { useAppDispatch } from './useRedux';

// Query keys
export const authKeys = {
	all: ['auth'] as const,
	currentUser: () => [...authKeys.all, 'current-user'] as const,
};

/**
 * Hook for getting current authenticated user
 * @returns Query result with current user data
 */
export const useCurrentUser = () => {
	// Use Redux state instead of local state for consistency with HOCs
	const { isAuthenticated } = useSelector((state: RootState) => state.user);

	return useQuery({
		queryKey: authKeys.currentUser(),
		queryFn: () => authService.getCurrentUser(),
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		enabled: isAuthenticated,
	});
};

/**
 * Hook for user login
 * @returns Mutation for user login with credentials
 */
export const useLogin = () => {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();

	return useMutation({
		mutationFn: (credentials: UserLoginRequest) =>
			authService.login({
				email: credentials.email,
				password: credentials.password,
			}),
		onSuccess: async data => {
			// Verify token is stored before updating Redux state
			// This prevents race condition where queries start before token is available
			const tokenStored = await authService.waitForTokenStorage();

			// Only update Redux if token is stored successfully and user data exists
			if (tokenStored && data.user) {
				// Verify token matches user before updating Redux
				const tokenMatches = await authService.verifyStoredTokenForUser(data.user.id);

				if (tokenMatches) {
				// Update Redux state for HOCs consistency
					// setUser already sets isAuthenticated = true
				dispatch(setUser(data.user));

				logger.authInfo('Login successful - Redux state updated', {
					success: true,
					userId: data.user.id,
					email: data.user.email,
				});

				// Small delay to ensure Redux state is fully updated before triggering queries
				await new Promise(resolve => setTimeout(resolve, 50));

				// Invalidate auth-related queries after token is stored and Redux state is updated
				// This ensures queries have access to the token when they execute
				// Note: We don't use queryClient.clear() here to avoid clearing all queries
				// which could cause issues with other queries that are still needed
				queryClient.invalidateQueries({ queryKey: authKeys.all });
				} else {
					logger.authError('Token mismatch - not updating Redux', {
						userId: data.user.id,
					});
				}
			} else {
				logger.authError('Login failed - token not stored or user data missing', {
					success: tokenStored,
				});
			}
		},
	});
};

/**
 * Hook for user registration
 * @returns Mutation for user registration with credentials
 */
export const useRegister = () => {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();

	return useMutation({
		mutationFn: (credentials: UserRegisterRequest) => authService.register(credentials),
		onSuccess: async data => {
			// Verify token is stored before updating Redux state
			// This prevents race condition where queries start before token is available
			const tokenStored = await authService.waitForTokenStorage();

			// Only update Redux if token is stored successfully and user data exists
			if (tokenStored && data.user) {
				// Verify the stored token matches the user we're setting
				const tokenMatches = await authService.verifyStoredTokenForUser(data.user.id);

				logger.authInfo('Registration successful - verifying token before Redux update', {
					success: true,
					userId: data.user.id,
					email: data.user.email,
					tokenMatches,
				});

				// Only update Redux if token matches user
				if (tokenMatches) {
					// Update Redux state for HOCs consistency
					// setUser already sets isAuthenticated = true
					dispatch(setUser(data.user));

					logger.authInfo('Registration successful - Redux state updated', {
						success: true,
						userId: data.user.id,
						email: data.user.email,
					});

					// Small delay to ensure Redux state is fully updated before triggering queries
					await new Promise(resolve => setTimeout(resolve, 50));

					// Invalidate auth-related queries after token is stored and Redux state is updated
					// This ensures queries have access to the token when they execute
					// Note: We don't use queryClient.clear() here to avoid clearing all queries
					// which could cause issues with other queries that are still needed
					queryClient.invalidateQueries({ queryKey: authKeys.all });
				} else {
					logger.authError('Token mismatch - not updating Redux', {
						userId: data.user.id,
					});
				}
			} else {
				logger.authError('Registration failed - token not stored or user data missing', {
					success: tokenStored,
				});
			}
		},
	});
};
