import { useSelector } from 'react-redux';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { CLIENT_STORAGE_KEYS } from '../constants';
import { setAuthenticated, setUser } from '../redux/slices';
import { authService, storageService } from '../services';
import type { RootState, UserLoginRequest, UserRegisterRequest } from '../types';
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
		staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
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
			let tokenStored = false;
			let attempts = 0;
			const maxAttempts = 10;

			while (!tokenStored && attempts < maxAttempts) {
				const tokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
				tokenStored = tokenResult.success && !!tokenResult.data;
				if (!tokenStored) {
					await new Promise(resolve => setTimeout(resolve, 50));
					attempts++;
				}
			}

			// Only update Redux if token is stored successfully and user data exists
			if (tokenStored && data.user) {
				// Update Redux state for HOCs consistency
				dispatch(setAuthenticated(true));
				dispatch(setUser(data.user));

				logger.authInfo('Login successful - Redux state updated', {
					success: true,
					hasData: !!data.user,
				});

				// Small delay to ensure Redux state is fully updated before triggering queries
				await new Promise(resolve => setTimeout(resolve, 50));

				// Invalidate auth-related queries after token is stored and Redux state is updated
				// This ensures queries have access to the token when they execute
				queryClient.invalidateQueries({ queryKey: authKeys.all });
				// Clear any cached data that might be user-specific
				queryClient.clear();
			} else {
				logger.authError('Login failed - token not stored or user data missing', {
					success: tokenStored,
					hasData: !!data.user,
					attempt: attempts,
				});
			}
		},
		onError: error => {
			logger.authError('Login mutation failed', {
				error: getErrorMessage(error),
			});
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
			let tokenStored = false;
			let attempts = 0;
			const maxAttempts = 10;

			while (!tokenStored && attempts < maxAttempts) {
				const tokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
				tokenStored = tokenResult.success && !!tokenResult.data;
				if (!tokenStored) {
					await new Promise(resolve => setTimeout(resolve, 50));
					attempts++;
				}
			}

			// Only update Redux if token is stored successfully and user data exists
			if (tokenStored && data.user) {
				// Update Redux state for HOCs consistency
				dispatch(setAuthenticated(true));
				dispatch(setUser(data.user));

				logger.authInfo('Registration successful - Redux state updated', {
					success: true,
					hasData: !!data.user,
				});

				// Small delay to ensure Redux state is fully updated before triggering queries
				await new Promise(resolve => setTimeout(resolve, 50));

				// Invalidate auth-related queries after token is stored and Redux state is updated
				// This ensures queries have access to the token when they execute
				queryClient.invalidateQueries({ queryKey: authKeys.all });
				// Clear any cached data that might be user-specific
				queryClient.clear();
			} else {
				logger.authError('Registration failed - token not stored or user data missing', {
					success: tokenStored,
					hasData: !!data.user,
					attempt: attempts,
				});
			}
		},
		onError: error => {
			logger.authError('Registration mutation failed', {
				error: getErrorMessage(error),
			});
		},
	});
};
