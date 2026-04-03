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
				queryKey: QUERY_KEYS.analytics.all,
				exact: false,
			})
		);

		await Promise.all(promises);
	}

	// Add new method specifically for game completion
	async invalidateAfterGameComplete(queryClient: QueryClient, userId: string): Promise<void> {
		await this.invalidateGameQueries(queryClient, userId);
		await this.invalidateCreditsQueries(queryClient, userId);

		logger.userInfo('Invalidated queries after game completion', { userId });
	}

	async invalidateAuthQueries(queryClient: QueryClient): Promise<void> {
		await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all, exact: false });
	}

	async invalidateUserQueries(queryClient: QueryClient, userId?: string): Promise<void> {
		await this.invalidateAuthQueries(queryClient);

		await queryClient.invalidateQueries({
			queryKey: QUERY_KEYS.user.profile(),
			exact: false,
		});

		if (userId) {
			await this.invalidateByServerKey(queryClient, CACHE_KEYS.USER.PROFILE(userId));
			await this.invalidateByServerKey(queryClient, CACHE_KEYS.USER.CREDITS(userId));
		}
	}

	async invalidateCreditsQueries(queryClient: QueryClient, userId?: string): Promise<void> {
		if (userId) {
			await this.invalidateByServerKey(queryClient, CACHE_KEYS.CREDITS.BALANCE(userId));
			await this.invalidateByServerKey(queryClient, CACHE_KEYS.PAYMENT.HISTORY(userId));
		}

		await this.invalidateByServerKey(queryClient, CACHE_KEYS.CREDITS.PACKAGES_ALL);
		await queryClient.invalidateQueries({
			queryKey: QUERY_KEYS.credits.balance(),
			exact: false,
		});
		await queryClient.invalidateQueries({
			queryKey: QUERY_KEYS.credits.paymentHistory(),
			exact: false,
		});
	}

	async invalidateLeaderboardQueries(queryClient: QueryClient): Promise<void> {
		await this.invalidateByServerKey(queryClient, CACHE_KEYS.LEADERBOARD.GLOBAL(100, 0));
		await queryClient.invalidateQueries({
			queryKey: QUERY_KEYS.leaderboard.all,
			exact: false,
		});
	}

	async invalidateAnalyticsQueries(queryClient: QueryClient, userId?: string): Promise<void> {
		if (userId) {
			await this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.USER(userId));
		}

		await this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_STATS);
		await this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_DIFFICULTY);
		await this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.TOPICS_STATS({}));
		await this.invalidateByServerKey(queryClient, CACHE_KEYS.ANALYTICS.GLOBAL_TRENDS({}));
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
