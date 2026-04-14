import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { TIME_PERIODS_MS, UserRole } from '@shared/constants';
import type { AuthCredentials, BasicUser, ChangePasswordData } from '@shared/types';

import { AUTH_TOKEN_CHANGED_EVENT, QUERY_KEYS, STORAGE_KEYS } from '@/constants';
import type { UseUserRoleReturn } from '@/types';
import { authService, clientLogger as logger, queryInvalidationService } from '@/services';
import { getAuthCurrentUserQueryKey, readAuthTokenSnapshotForQueryKey } from '@/utils';

function useAuthTokenSnapshot(): string | null {
	const [tokenSnapshot, setTokenSnapshot] = useState<string | null>(() => {
		try {
			return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
		} catch {
			return null;
		}
	});

	useEffect(() => {
		const checkToken = () => {
			try {
				setTokenSnapshot(sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN));
			} catch {
				setTokenSnapshot(null);
			}
		};

		window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, checkToken);

		return () => {
			window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, checkToken);
		};
	}, []);

	return tokenSnapshot;
}

export function useHasToken(): boolean {
	const tokenSnapshot = useAuthTokenSnapshot();
	return tokenSnapshot != null && tokenSnapshot !== '';
}

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

					try {
						await queryClient.cancelQueries({ queryKey: QUERY_KEYS.auth.all, exact: false });
						await queryClient.cancelQueries({ queryKey: QUERY_KEYS.user.profile() });
					} catch {
						// ignore cancel failures
					}
					queryClient.setQueryData(getAuthCurrentUserQueryKey(readAuthTokenSnapshotForQueryKey()), data.user, {
						updatedAt: Date.now(),
					});

					await queryInvalidationService.invalidateAuthQueries(queryClient);
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

					try {
						await queryClient.cancelQueries({ queryKey: QUERY_KEYS.auth.all, exact: false });
						await queryClient.cancelQueries({ queryKey: QUERY_KEYS.user.profile() });
					} catch {
						// ignore cancel failures
					}
					queryClient.setQueryData(getAuthCurrentUserQueryKey(readAuthTokenSnapshotForQueryKey()), data.user, {
						updatedAt: Date.now(),
					});

					await queryInvalidationService.invalidateAuthQueries(queryClient);
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

export const useCurrentUser = () => {
	const tokenSnapshot = useAuthTokenSnapshot();
	const hasToken = tokenSnapshot != null && tokenSnapshot !== '';
	const currentUserQueryKey = useMemo(() => getAuthCurrentUserQueryKey(tokenSnapshot), [tokenSnapshot]);

	return useQuery({
		queryKey: currentUserQueryKey,
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

export const useUserRole = (): UseUserRoleReturn => {
	const { data: currentUser } = useCurrentUser();
	const role = currentUser?.role ?? UserRole.USER;
	return { role, isAdmin: role === UserRole.ADMIN };
};

export const useCurrentUserData = (): BasicUser | null => {
	const { data: currentUser } = useCurrentUser();
	return currentUser ?? null;
};

export const useChangePassword = () => {
	return useMutation({
		mutationFn: (passwordData: ChangePasswordData) => authService.changePassword(passwordData),
	});
};
