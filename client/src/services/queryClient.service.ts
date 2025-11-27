/**
 * React Query Client Configuration
 *
 * @module QueryClient
 * @description React Query client setup and utility functions for data fetching
 * @used_by client/src/hooks, client/src/components, client/src/views
 */
import { QueryClient } from '@tanstack/react-query';

import { clientLogger as logger } from '@shared/services';
import { calculateRetryDelay, getErrorMessage } from '@shared/utils';

export const prefetchCommonQueries = async () => {
	try {
		await queryClient.prefetchQuery({
			queryKey: ['global-leaderboard', 10],
			queryFn: async () => {
				const { gameHistoryService } = await import('./gameHistory.service');
				return gameHistoryService.getLeaderboard(10);
			},
			staleTime: 2 * 60 * 1000,
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
				const { apiService } = await import('./api.service');
				return apiService.getCreditPackages();
			},
			staleTime: 10 * 60 * 1000,
		});

		// Prefetch credit balance
		await queryClient.prefetchQuery({
			queryKey: ['credits', 'balance'],
			queryFn: async () => {
				const { apiService } = await import('./api.service');
				return apiService.getCreditBalance();
			},
			staleTime: 5 * 60 * 1000,
		});

		logger.apiInfo('Authenticated queries prefetched successfully');
	} catch (error) {
		logger.apiError('Failed to prefetch authenticated queries', { error: getErrorMessage(error) });
	}
};

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
			retry: (failureCount, error: Error & { status?: number }) => {
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
				if (error?.status && error.status >= 400 && error.status < 500) {
					return false;
				}
				return failureCount < 2;
			},
			networkMode: 'online',
		},
	},
});
