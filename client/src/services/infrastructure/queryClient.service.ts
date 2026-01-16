import { QueryClient } from '@tanstack/react-query';

import { TIME_PERIODS_MS, VALIDATORS } from '@shared/constants';
import { calculateRetryDelay, getErrorMessage, isRecord } from '@shared/utils';

import { QUERY_KEYS, ROUTES } from '@/constants';
import { analyticsService, authService, creditsService, clientLogger as logger } from '@/services';

function isErrorWithProperties(error: unknown): error is { name?: string; message?: string } {
	if (!isRecord(error)) {
		return false;
	}

	return (
		(error.name === undefined || VALIDATORS.string(error.name)) &&
		(error.message === undefined || VALIDATORS.string(error.message))
	);
}

function isSessionExpiredError(error: unknown): boolean {
	if (error instanceof Error) {
		return (
			error.name === 'SessionExpiredError' ||
			error.message.includes('Session expired') ||
			error.message.includes('SESSION_EXPIRED')
		);
	}

	if (isErrorWithProperties(error)) {
		return (
			error.name === 'SessionExpiredError' ||
			(error.message?.includes('Session expired') ?? false) ||
			(error.message?.includes('SESSION_EXPIRED') ?? false)
		);
	}

	return false;
}

function shouldRetry(failureCount: number, error: unknown, maxRetries: number): boolean {
	// Never retry on session expired errors
	if (isSessionExpiredError(error)) {
		return false;
	}

	// Extract status code from error (can be Error instance or plain object)
	let statusCode: number | undefined;
	if (isRecord(error)) {
		// Check for status property (used by some libraries)
		if (VALIDATORS.number(error.status)) {
			statusCode = error.status;
		}
		// Check for statusCode property (used by our ApiError)
		else if (VALIDATORS.number(error.statusCode)) {
			statusCode = error.statusCode;
		}
	}

	// Don't retry on 4xx client errors (validation errors, bad requests, etc.)
	if (statusCode && statusCode >= 400 && statusCode < 500) {
		return false;
	}

	return failureCount < maxRetries;
}

function isAuthPage(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	const currentPath = window.location.pathname;
	return currentPath === ROUTES.LOGIN || currentPath === ROUTES.REGISTER;
}

async function handleSessionExpired(client: QueryClient): Promise<void> {
	try {
		logger.authError('Session expired, clearing auth data and redirecting to login');

		// Clear auth data (tokens, storage, etc.)
		await authService.logout();

		// Clear React Query cache
		client.clear();

		// Redirect to login with full page reload to ensure all state is cleared
		// This includes Redux state (via sessionStorage clear) and any other client-side state
		if (!isAuthPage() && typeof window !== 'undefined') {
			window.location.href = ROUTES.LOGIN;
		}
	} catch (error) {
		logger.systemError('Failed to handle session expired', {
			errorInfo: { message: getErrorMessage(error) },
		});
		// Even if logout fails, try to redirect to login
		if (!isAuthPage() && typeof window !== 'undefined') {
			window.location.href = ROUTES.LOGIN;
		}
	}
}

function setupErrorHandlers(client: QueryClient): void {
	client.getQueryCache().subscribe(event => {
		// Check for errors when query state is updated
		if (event.type === 'updated' && event.query.state.error) {
			const error = event.query.state.error;
			if (isSessionExpiredError(error)) {
				handleSessionExpired(client).catch(handleError => {
					logger.systemError('Failed to handle session expired in query cache subscription', {
						errorInfo: { message: getErrorMessage(handleError) },
					});
				});
			}
		}
	});

	client.getMutationCache().subscribe(event => {
		// Check for errors when mutation state is updated
		if (event.type === 'updated' && event.mutation.state.error) {
			const error = event.mutation.state.error;
			if (isSessionExpiredError(error)) {
				handleSessionExpired(client).catch(handleError => {
					logger.systemError('Failed to handle session expired in mutation cache subscription', {
						errorInfo: { message: getErrorMessage(handleError) },
					});
				});
			}
		}
	});
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
			gcTime: TIME_PERIODS_MS.TEN_MINUTES,
			retry: (failureCount, error: Error & { status?: number }) => {
				return shouldRetry(failureCount, error, 3);
			},
			retryDelay: attemptIndex => {
				return calculateRetryDelay(TIME_PERIODS_MS.SECOND, attemptIndex, {
					maxDelay: TIME_PERIODS_MS.THIRTY_SECONDS,
					jitter: { fixedJitter: TIME_PERIODS_MS.SECOND },
				});
			},
			refetchOnWindowFocus: false,
			refetchOnReconnect: true,
			refetchOnMount: true,
			networkMode: 'online',
		},
		mutations: {
			retry: (failureCount, error: Error & { status?: number }) => {
				return shouldRetry(failureCount, error, 2);
			},
			networkMode: 'online',
		},
	},
});

// Setup global error handlers
setupErrorHandlers(queryClient);

export async function prefetchCommonQueries(): Promise<void> {
	try {
		await queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.leaderboard.global(10, 0),
			queryFn: async () => {
				return analyticsService.getGlobalLeaderboard(10, 0);
			},
			staleTime: TIME_PERIODS_MS.TWO_MINUTES,
		});

		logger.apiInfo('Common queries prefetched successfully');
	} catch (error) {
		logger.apiError('Failed to prefetch common queries', { errorInfo: { message: getErrorMessage(error) } });
	}
}

export async function prefetchAuthenticatedQueries(): Promise<void> {
	try {
		// Prefetch credit packages
		await queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.credits.packages(),
			queryFn: async () => {
				return creditsService.getCreditPackages();
			},
			staleTime: TIME_PERIODS_MS.HOUR,
		});

		// Prefetch credit balance
		await queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.credits.balance(),
			queryFn: async () => {
				return creditsService.getCreditBalance();
			},
			staleTime: TIME_PERIODS_MS.HOUR,
		});

		logger.apiInfo('Authenticated queries prefetched successfully');
	} catch (error) {
		logger.apiError('Failed to prefetch authenticated queries', { errorInfo: { message: getErrorMessage(error) } });
	}
}
