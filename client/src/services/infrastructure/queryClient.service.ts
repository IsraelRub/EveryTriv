/**
 * React Query Client Configuration
 *
 * @module QueryClient
 * @description React Query client setup and utility functions for data fetching
 * @used_by client/src/hooks, client/src/components, client/src/views
 */
import { QueryClient } from '@tanstack/react-query';

import { TIME_PERIODS_MS } from '@shared/constants';
import { calculateRetryDelay, getErrorMessage } from '@shared/utils';
import { ROUTES } from '@/constants';
import { creditsService, leaderboardService, clientLogger as logger, authService } from '@/services';

export const prefetchCommonQueries = async () => {
	try {
		await queryClient.prefetchQuery({
			queryKey: ['globalLeaderboard', 10, 0],
			queryFn: async () => {
				return leaderboardService.getGlobalLeaderboard(10, 0);
			},
			staleTime: TIME_PERIODS_MS.TWO_MINUTES,
		});

		logger.apiInfo('Common queries prefetched successfully');
	} catch (error) {
		logger.apiError('Failed to prefetch common queries', { error: getErrorMessage(error) });
	}
};

export const prefetchAuthenticatedQueries = async () => {
	try {
		// Prefetch credit packages
		await queryClient.prefetchQuery({
			queryKey: ['credits', 'packages'],
			queryFn: async () => {
				return creditsService.getCreditPackages();
			},
			staleTime: TIME_PERIODS_MS.TEN_MINUTES,
		});

		// Prefetch credit balance
		await queryClient.prefetchQuery({
			queryKey: ['credits', 'balance'],
			queryFn: async () => {
				return creditsService.getCreditBalance();
			},
			staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		});

		logger.apiInfo('Authenticated queries prefetched successfully');
	} catch (error) {
		logger.apiError('Failed to prefetch authenticated queries', { error: getErrorMessage(error) });
	}
};

/**
 * Check if error is SessionExpiredError
 */
const isSessionExpiredError = (error: unknown): boolean => {
	if (error instanceof Error) {
		return error.name === 'SessionExpiredError' || 
			error.message.includes('Session expired') ||
			error.message.includes('SESSION_EXPIRED');
	}
	
	if (typeof error === 'object' && error !== null) {
		const errorObj = error as { name?: string; message?: string };
		return errorObj.name === 'SessionExpiredError' ||
			(errorObj.message?.includes('Session expired') ?? false) ||
			(errorObj.message?.includes('SESSION_EXPIRED') ?? false);
	}
	
	return false;
};

/**
 * Handle session expired error by clearing auth data and redirecting to login
 * Uses full page reload to ensure all state (Redux, React Query, etc.) is cleared
 */
const handleSessionExpired = async (client: QueryClient): Promise<void> => {
	try {
		logger.authError('Session expired, clearing auth data and redirecting to login');
		
		// Clear auth data (tokens, storage, etc.)
		await authService.logout();
		
		// Clear React Query cache
		client.clear();
		
		// Check if we're already on an auth page
		const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
		const isAuthPage = currentPath === ROUTES.LOGIN || currentPath === ROUTES.REGISTER;
		
		// Redirect to login with full page reload to ensure all state is cleared
		// This includes Redux state (via sessionStorage clear) and any other client-side state
		if (!isAuthPage && typeof window !== 'undefined') {
			window.location.href = ROUTES.LOGIN;
		}
	} catch (error) {
		logger.systemError('Failed to handle session expired', {
			error: getErrorMessage(error),
		});
		// Even if logout fails, try to redirect to login
		if (typeof window !== 'undefined') {
			const currentPath = window.location.pathname;
			const isAuthPage = currentPath === ROUTES.LOGIN || currentPath === ROUTES.REGISTER;
			if (!isAuthPage) {
				window.location.href = ROUTES.LOGIN;
			}
		}
	}
};

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
			gcTime: TIME_PERIODS_MS.TEN_MINUTES,
			retry: (failureCount, error: Error & { status?: number }) => {
				// Never retry on session expired errors
				if (isSessionExpiredError(error)) {
					return false;
				}
				
				if (error?.status && error.status >= 400 && error.status < 500) {
					return false;
				}
				return failureCount < 3;
			},
			retryDelay: attemptIndex => {
				return calculateRetryDelay(1000, attemptIndex, {
					maxDelay: 30000,
					jitter: { fixedJitter: 1000 },
				});
			},
			refetchOnWindowFocus: false,
			refetchOnReconnect: true,
			refetchOnMount: true,
			networkMode: 'online',
		},
		mutations: {
			retry: (failureCount, error: Error & { status?: number }) => {
				// Never retry on session expired errors
				if (isSessionExpiredError(error)) {
					return false;
				}
				
				if (error?.status && error.status >= 400 && error.status < 500) {
					return false;
				}
				return failureCount < 2;
			},
			networkMode: 'online',
		},
	},
});

// Setup global error handlers for queries and mutations
// React Query v5 uses queryCache and mutationCache subscriptions instead of onError in defaultOptions
// We check for errors in the 'updated' event when query/mutation state changes
queryClient.getQueryCache().subscribe(event => {
	// Check for errors when query state is updated
	if (event.type === 'updated' && event.query.state.error) {
		const error = event.query.state.error;
		if (isSessionExpiredError(error)) {
			handleSessionExpired(queryClient).catch(handleError => {
				logger.systemError('Failed to handle session expired in query cache subscription', {
					error: getErrorMessage(handleError),
				});
			});
		}
	}
});

queryClient.getMutationCache().subscribe(event => {
	// Check for errors when mutation state is updated
	if (event.type === 'updated' && event.mutation.state.error) {
		const error = event.mutation.state.error;
		if (isSessionExpiredError(error)) {
			handleSessionExpired(queryClient).catch(handleError => {
				logger.systemError('Failed to handle session expired in mutation cache subscription', {
					error: getErrorMessage(handleError),
				});
			});
		}
	}
});
