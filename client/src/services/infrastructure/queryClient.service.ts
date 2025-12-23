/**
 * React Query Client Configuration
 *
 * @module QueryClient
 * @description React Query client setup and utility functions for data fetching
 * @used_by client/src/hooks, client/src/components, client/src/views
 */
import { QueryClient } from '@tanstack/react-query';

import { calculateRetryDelay, getErrorMessage } from '@shared/utils';

import { creditsService, leaderboardService, clientLogger as logger } from '@/services';

export const prefetchCommonQueries = async () => {
	try {
		await queryClient.prefetchQuery({
			queryKey: ['globalLeaderboard', 10, 0],
			queryFn: async () => {
				return leaderboardService.getGlobalLeaderboard(10, 0);
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
				return creditsService.getCreditPackages();
			},
			staleTime: 10 * 60 * 1000,
		});

		// Prefetch credit balance
		await queryClient.prefetchQuery({
			queryKey: ['credits', 'balance'],
			queryFn: async () => {
				return creditsService.getCreditBalance();
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
