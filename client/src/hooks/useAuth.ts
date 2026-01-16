import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { TIME_PERIODS_MS, UserRole } from '@shared/constants';
import type { AuthCredentials, BasicUser, ChangePasswordData } from '@shared/types';

import { QUERY_KEYS, STORAGE_KEYS } from '@/constants';
import { authService, clientLogger as logger } from '@/services';
import { resetGameSession, resetLeaderboardPeriod, resetMultiplayer } from '@/redux/slices';
import { store } from '@/redux/store';

function useHasToken(): boolean {
	const [hasToken, setHasToken] = useState<boolean>(() => {
		// Initialize synchronously from localStorage
		try {
			const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
			return !!token;
		} catch {
			return false;
		}
	});

	useEffect(() => {
		// Check token synchronously from localStorage
		const checkToken = () => {
			try {
				const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
				setHasToken(!!token);
			} catch {
				setHasToken(false);
			}
		};

		// Listen for storage changes from other windows/tabs
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === STORAGE_KEYS.AUTH_TOKEN) {
				checkToken();
			}
		};

		// Listen for custom events from the same window (when token is set/removed)
		const handleTokenChange = () => {
			checkToken();
		};

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('auth-token-changed', handleTokenChange);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('auth-token-changed', handleTokenChange);
		};
	}, []);

	return hasToken;
}

// ============================================================================
// Authentication Mutations (Login/Register)
// ============================================================================

export const useLogin = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (credentials: AuthCredentials) => authService.login(credentials),
		onSuccess: async data => {
			// Verify token is stored before invalidating queries
			// This prevents race condition where queries start before token is available
			const tokenStored = await authService.waitForTokenStorage();

			if (tokenStored && data.user) {
				// Verify token matches user
				const tokenMatches = await authService.verifyStoredTokenForUser(data.user.id);

				if (tokenMatches) {
					logger.authInfo('Login successful', {
						success: true,
						userId: data.user.id,
						emails: { current: data.user.email },
					});

					// Update React Query cache with user data
					queryClient.setQueryData(QUERY_KEYS.auth.currentUser(), data.user);

					// Invalidate auth-related queries to trigger refetch
					queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
				} else {
					logger.authError('Token mismatch', {
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

export const useRegister = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (credentials: AuthCredentials & { firstName?: string; lastName?: string }) =>
			authService.register(credentials),
		onSuccess: async data => {
			// Verify token is stored before invalidating queries
			// This prevents race condition where queries start before token is available
			const tokenStored = await authService.waitForTokenStorage();

			if (tokenStored && data.user) {
				// Verify the stored token matches the user
				const tokenMatches = await authService.verifyStoredTokenForUser(data.user.id);

				logger.authInfo('Registration successful - verifying token', {
					success: true,
					userId: data.user.id,
					emails: { current: data.user.email },
					tokenMatches,
				});

				if (tokenMatches) {
					logger.authInfo('Registration successful', {
						success: true,
						userId: data.user.id,
						emails: { current: data.user.email },
					});

					// Update React Query cache with user data
					queryClient.setQueryData(QUERY_KEYS.auth.currentUser(), data.user);

					// Invalidate auth-related queries to trigger refetch
					queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
				} else {
					logger.authError('Token mismatch', {
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

// ============================================================================
// Authentication State Hooks
// ============================================================================

export const useCurrentUser = () => {
	const hasToken = useHasToken();

	return useQuery({
		queryKey: QUERY_KEYS.auth.currentUser(),
		queryFn: () => authService.getCurrentUser(),
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		retry: false, // Don't retry on auth errors
		enabled: hasToken, // Only fetch if token exists to prevent unnecessary 401 errors
	});
};

export const useIsAuthenticated = (): boolean => {
	const hasToken = useHasToken();
	const { data: currentUser, isSuccess, isError, isLoading } = useCurrentUser();

	// User is authenticated if:
	// 1. Token exists AND
	// 2. We successfully fetched user data
	// If query failed with error, user is not authenticated
	if (!hasToken) {
		return false;
	}

	// If query is still loading and we have a token, wait for it to complete
	if (isLoading) {
		return false; // Don't consider authenticated until query completes
	}

	// If query completed successfully with user data, user is authenticated
	return isSuccess && !isError && currentUser !== null && currentUser !== undefined;
};

export const useUserRole = (): UserRole | undefined => {
	const { data: currentUser } = useCurrentUser();
	return currentUser?.role ?? UserRole.USER;
};

export const useCurrentUserData = (): BasicUser | null => {
	const { data: currentUser } = useCurrentUser();
	return currentUser ?? null;
};

// ============================================================================
// Account Management
// ============================================================================

export const useChangePassword = () => {
	return useMutation({
		mutationFn: (passwordData: ChangePasswordData) => authService.changePassword(passwordData),
	});
};

// ============================================================================
// Logout Handler
// ============================================================================

export function useAuthLogoutHandler(): void {
	useEffect(() => {
		const unregisterCallback = authService.registerLogoutCallback(() => {
			store.dispatch(resetGameSession());
			store.dispatch(resetMultiplayer());
			store.dispatch(resetLeaderboardPeriod());
		});

		return () => {
			unregisterCallback();
		};
	}, []);
}
