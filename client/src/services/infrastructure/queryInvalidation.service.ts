import type { QueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { clientLogger as logger } from '@/services';

const REFETCH_ALL = { refetchType: 'all' as const };

class QueryInvalidationService {
	async invalidateGameQueries(queryClient: QueryClient, userId?: string): Promise<void> {
		const promises: Promise<void>[] = [];

		if (userId) {
			promises.push(
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.analytics.user(),
					exact: false,
					...REFETCH_ALL,
				})
			);
			promises.push(
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.trivia.gameHistory('current'),
					exact: false,
					...REFETCH_ALL,
				})
			);
			promises.push(
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.admin.userStatistics(userId),
					exact: true,
					...REFETCH_ALL,
				})
			);
		}

		promises.push(
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.globalStats(),
				exact: false,
				...REFETCH_ALL,
			})
		);
		promises.push(
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.globalDifficultyStats(),
				exact: false,
				...REFETCH_ALL,
			})
		);
		promises.push(
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.popularTopics(),
				exact: false,
				...REFETCH_ALL,
			})
		);
		promises.push(
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.globalTrends(),
				exact: false,
				...REFETCH_ALL,
			})
		);
		promises.push(
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.leaderboard.all,
				exact: false,
				...REFETCH_ALL,
			})
		);
		promises.push(
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.all,
				exact: false,
				...REFETCH_ALL,
			})
		);

		await Promise.all(promises);
	}

	async invalidateAfterGameComplete(queryClient: QueryClient, userId: string): Promise<void> {
		await Promise.all([this.invalidateGameQueries(queryClient, userId), this.invalidateCreditsQueries(queryClient)]);

		logger.userInfo('Invalidated queries after game completion', { userId });
	}

	async invalidateAuthQueries(queryClient: QueryClient): Promise<void> {
		await queryClient.invalidateQueries({
			queryKey: QUERY_KEYS.auth.all,
			exact: false,
			...REFETCH_ALL,
		});
	}

	async invalidateUserQueries(queryClient: QueryClient): Promise<void> {
		await this.invalidateAuthQueries(queryClient);

		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.user.profile(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.user.credits(),
				exact: false,
				...REFETCH_ALL,
			}),
		]);
	}

	async invalidateCreditsQueries(queryClient: QueryClient): Promise<void> {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.credits.balance(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.credits.paymentHistory(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.credits.packages(),
				exact: false,
				...REFETCH_ALL,
			}),
		]);
	}

	async invalidateLeaderboardQueries(queryClient: QueryClient): Promise<void> {
		await queryClient.invalidateQueries({
			queryKey: QUERY_KEYS.leaderboard.all,
			exact: false,
			...REFETCH_ALL,
		});
	}

	async invalidateAnalyticsQueries(queryClient: QueryClient, userId?: string): Promise<void> {
		const promises: Promise<void>[] = [
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.globalStats(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.globalDifficultyStats(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.popularTopics(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.globalTrends(),
				exact: false,
				...REFETCH_ALL,
			}),
		];

		if (userId) {
			promises.push(
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.analytics.user(),
					exact: false,
					...REFETCH_ALL,
				})
			);
		}

		await Promise.all(promises);
	}

	async invalidateAdminDashboardQueries(queryClient: QueryClient): Promise<void> {
		const promises: Promise<void>[] = [
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.globalStats(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.globalDifficultyStats(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.analytics.popularTopics(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.admin.gameStatistics(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.admin.businessMetrics(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: [...QUERY_KEYS.admin.all, 'adminUserStatistics'],
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.admin.allUsersConsistency(),
				exact: false,
				...REFETCH_ALL,
			}),
			queryClient.invalidateQueries({
				queryKey: [...QUERY_KEYS.admin.all, 'userStatsConsistency'],
				exact: false,
				...REFETCH_ALL,
			}),
		];
		await Promise.all(promises);
	}
}

export const queryInvalidationService = new QueryInvalidationService();
