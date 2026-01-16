import type { QueryClient } from '@tanstack/react-query';

import { CACHE_KEYS, toReactQueryKey } from '@shared/constants';
import { ensureErrorObject } from '@shared/utils';

import { QUERY_KEYS } from '@/constants';
import { clientLogger as logger } from '@/services';

class QueryInvalidationService {
	invalidateByServerKey(queryClient: QueryClient, serverKey: string): void {
		try {
			// Convert server cache key (string) to React Query key (array)
			const queryKey = toReactQueryKey(serverKey);

			// Invalidate queries that match the key (prefix matching for nested keys)
			queryClient.invalidateQueries({ queryKey, exact: false });
		} catch (error) {
			logger.systemError(ensureErrorObject(error), {
				contextMessage: 'Failed to invalidate queries by server key',
				serverKey,
			});
		}
	}

	invalidateGameQueries(queryClient: QueryClient, userId?: string): void {
		if (userId) {
			this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.USER(userId));
			this.invalidateByServerKey(queryClient, CACHE_KEYS.GAME_HISTORY.USER(userId));
		}

		this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_STATS);
		this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_DIFFICULTY);
		this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.TOPICS_STATS({}));
		this.invalidateByServerKey(queryClient, CACHE_KEYS.LEADERBOARD.GLOBAL(100, 0));

		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaderboard.all });
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.all });
	}

	invalidateUserQueries(queryClient: QueryClient, userId?: string): void {
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });

		if (userId) {
			// Invalidate with actual userId for server cache sync
			this.invalidateByServerKey(queryClient, CACHE_KEYS.USER.PROFILE(userId));
			this.invalidateByServerKey(queryClient, CACHE_KEYS.USER.CREDITS(userId));
		}

		// Also invalidate 'current' keys for backward compatibility and local cache
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.all });
	}

	invalidateCreditsQueries(queryClient: QueryClient, userId?: string): void {
		if (userId) {
			// Invalidate with actual userId for server cache sync
			this.invalidateByServerKey(queryClient, CACHE_KEYS.CREDITS.BALANCE(userId));
			this.invalidateByServerKey(queryClient, CACHE_KEYS.PAYMENT.HISTORY(userId));
		}

		// Invalidate packages (global, no userId)
		this.invalidateByServerKey(queryClient, CACHE_KEYS.CREDITS.PACKAGES_ALL);

		// Also invalidate 'current' keys for backward compatibility and local cache
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credits.all });
	}

	invalidateLeaderboardQueries(queryClient: QueryClient): void {
		this.invalidateByServerKey(queryClient, CACHE_KEYS.LEADERBOARD.GLOBAL(100, 0));
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaderboard.all });
	}

	invalidateAnalyticsQueries(queryClient: QueryClient, userId?: string): void {
		if (userId) {
			this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.USER(userId));
		}

		this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_STATS);
		this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_DIFFICULTY);
		this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.TOPICS_STATS({}));
		this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_TRENDS({}));
	}
}

export const queryInvalidationService = new QueryInvalidationService();
