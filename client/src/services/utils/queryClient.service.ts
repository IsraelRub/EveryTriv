/**
 * React Query Client Configuration
 *
 * @module QueryClient
 * @description React Query client setup and utility functions for data fetching
 * @used_by client/src/hooks, client/src/components, client/src/views
 */
import { clientLogger } from '@shared';
import { QueryClient } from '@tanstack/react-query';

export const prefetchCommonQueries = async () => {
  try {
    await queryClient.prefetchQuery({
      queryKey: ['global-leaderboard', 10],
      queryFn: async () => {
        const { apiService } = await import('../api/api.service');
        return apiService.getLeaderboardEntries(10);
      },
      staleTime: 2 * 60 * 1000,
    });

    clientLogger.apiInfo('Common queries prefetched successfully');
  } catch (error) {
    clientLogger.apiError('Failed to prefetch common queries', { error });
  }
};

export const prefetchAuthenticatedQueries = async () => {
  try {
    await queryClient.prefetchQuery({
      queryKey: ['points', 'packages'],
      queryFn: async () => {
        const { apiService } = await import('../api/api.service');
        return apiService.getPointPackages();
      },
      staleTime: 10 * 60 * 1000,
    });

    clientLogger.apiInfo('Authenticated queries prefetched successfully');
  } catch (error) {
    clientLogger.apiError('Failed to prefetch authenticated queries', { error });
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
        const baseDelay = Math.min(1000 * 2 ** attemptIndex, 30000);
        return baseDelay + Math.random() * 1000;
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

