import type { QueryClient } from '@tanstack/react-query';

import { CACHE_KEYS, toReactQueryKey } from '@shared/constants';
import { ensureErrorObject } from '@shared/utils';

import { QUERY_KEYS } from '@/constants';
import { clientLogger as logger } from '@/services';

class QueryInvalidationService {
	async invalidateByServerKey(queryClient: QueryClient, serverKey: string): Promise<void> {
		try {
			const queryKey = toReactQueryKey(serverKey);
			await queryClient.invalidateQueries({ queryKey, exact: false });
		} catch (error) {
			logger.systemError(ensureErrorObject(error), {
				contextMessage: 'Failed to invalidate queries by server key',
				serverKey,
			});
		}
	}

	async invalidateGameQueries(queryClient: QueryClient, userId?: string): Promise<void> {
		const promises: Promise<void>[] = [];

		if (userId) {
			promises.push(this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.USER(userId)));
			promises.push(
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.analytics.user('current'),
					exact: false,
				})
			);
			promises.push(this.invalidateByServerKey(queryClient, CACHE_KEYS.GAME_HISTORY.USER(userId)));
			promises.push(
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.trivia.gameHistory('current'),
					exact: false,
				})
			);
			promises.push(
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.admin.userStatistics(userId),
					exact: true,
				})
			);
		}

		promises.push(this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_STATS));
		promises.push(this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_DIFFICULTY));
		promises.push(
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.popularTopics(),
				exact: false,
			})
		);
		promises.push(
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.globalTrends(),
				exact: false,
			})
		);
		promises.push(this.invalidateByServerKey(queryClient, CACHE_KEYS.LEADERBOARD.GLOBAL(100, 0)));
		promises.push(
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.leaderboard.all,
				exact: false,
			})
		);
		promises.push(
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.leaderboard.stats(''),
				exact: false,
			})
		);
		promises.push(
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.all,
				exact: false,
			})
		);

		await Promise.all(promises);
	}

	// Add new method specifically for game completion
	invalidateAfterGameComplete(queryClient: QueryClient, userId: string): void {
		// This is called immediately after game finalization to ensure fresh data
		this.invalidateGameQueries(queryClient, userId);

		// Also invalidate credits (if credits were used)
		this.invalidateCreditsQueries(queryClient, userId);

		logger.userInfo('Invalidated queries after game completion', { userId });
	}

	invalidateAuthQueries(queryClient: QueryClient): void {
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
	}

	invalidateUserQueries(queryClient: QueryClient, userId?: string): void {
		this.invalidateAuthQueries(queryClient);

		if (userId) {
			this.invalidateByServerKey(queryClient, CACHE_KEYS.USER.PROFILE(userId));
			this.invalidateByServerKey(queryClient, CACHE_KEYS.USER.CREDITS(userId));
		}
	}

	invalidateCreditsQueries(queryClient: QueryClient, userId?: string): void {
		if (userId) {
			this.invalidateByServerKey(queryClient, CACHE_KEYS.CREDITS.BALANCE(userId));
			this.invalidateByServerKey(queryClient, CACHE_KEYS.PAYMENT.HISTORY(userId));
		}

		this.invalidateByServerKey(queryClient, CACHE_KEYS.CREDITS.PACKAGES_ALL);
	}

	invalidateLeaderboardQueries(queryClient: QueryClient): void {
		this.invalidateByServerKey(queryClient, CACHE_KEYS.LEADERBOARD.GLOBAL(100, 0));
		queryClient.invalidateQueries({
			queryKey: QUERY_KEYS.leaderboard.all,
			exact: false,
		});

		// Invalidate all leaderboard stats variants (all periods)
		queryClient.invalidateQueries({
			queryKey: QUERY_KEYS.leaderboard.stats(''),
			exact: false,
		});
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

	async invalidateAdminDashboardQueries(queryClient: QueryClient): Promise<void> {
		const promises: Promise<void>[] = [
			this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_STATS),
			this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_DIFFICULTY),
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.popularTopics(), exact: false }),
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.gameStatistics() }),
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.businessMetrics() }),
			queryClient.invalidateQueries({
				queryKey: [...QUERY_KEYS.admin.all, 'adminUserStatistics'],
				exact: false,
			}),
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.allUsersConsistency() }),
			queryClient.invalidateQueries({
				queryKey: [...QUERY_KEYS.admin.all, 'userStatsConsistency'],
				exact: false,
			}),
		];
		await Promise.all(promises);
	}
}

export const queryInvalidationService = new QueryInvalidationService();
