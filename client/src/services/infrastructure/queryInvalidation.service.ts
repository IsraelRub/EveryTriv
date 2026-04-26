import type { QueryClient } from '@tanstack/react-query';

import type { BasicUser, UserProfileResponseType } from '@shared/types';

import { QUERY_KEYS } from '@/constants';
import { clientLogger as logger } from '@/services';
import { userProfileToBasicUser } from '@/utils';

const REFETCH_ALL = { refetchType: 'all' as const };

class QueryInvalidationService {
	async invalidateGameQueries(queryClient: QueryClient, userId?: string): Promise<void> {
		const promises: Promise<void>[] = [];

		if (userId) {
			promises.push(
				queryClient.resetQueries({
					queryKey: QUERY_KEYS.analytics.user(),
					exact: false,
				})
			);
			promises.push(
				queryClient.resetQueries({
					queryKey: QUERY_KEYS.trivia.gameHistory('current'),
					exact: false,
				})
			);
			promises.push(
				queryClient.resetQueries({
					queryKey: QUERY_KEYS.admin.userStatistics(userId),
					exact: true,
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

	async syncUserProfileResponseFromMutation(
		queryClient: QueryClient,
		profileResponse: UserProfileResponseType
	): Promise<void> {
		if (!profileResponse?.profile) {
			return;
		}

		const basicUser = userProfileToBasicUser(profileResponse.profile);
		const profileKey = QUERY_KEYS.user.profile();
		const currentUserKeyPrefix = QUERY_KEYS.auth.currentUser();

		try {
			await Promise.all([
				queryClient.cancelQueries({ queryKey: profileKey }),
				queryClient.cancelQueries({ queryKey: currentUserKeyPrefix }),
			]);
		} catch {
			// best-effort cancel before cache write
		}

		queryClient.setQueryData(profileKey, profileResponse, { updatedAt: Date.now() });
		queryClient.setQueriesData(
			{ queryKey: currentUserKeyPrefix },
			(prev: BasicUser | undefined) => ({
				...basicUser,
				needsLegalAcceptance: prev?.needsLegalAcceptance ?? false,
			}),
			{ updatedAt: Date.now() }
		);

		await Promise.all([
			queryClient.invalidateQueries({ queryKey: profileKey, exact: true, refetchType: 'none' }),
			queryClient.invalidateQueries({ queryKey: currentUserKeyPrefix, exact: false, refetchType: 'none' }),
		]);
	}
}

export const queryInvalidationService = new QueryInvalidationService();
