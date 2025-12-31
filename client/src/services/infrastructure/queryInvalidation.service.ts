/**
 * Query Invalidation Service
 *
 * @module QueryInvalidationService
 * @description Service for managing React Query cache invalidation patterns
 * @used_by client/src/hooks
 */
import type { QueryClient } from '@tanstack/react-query';

/**
 * Query Invalidation Service
 * Provides centralized query invalidation patterns to avoid duplication
 */
class QueryInvalidationService {
	/**
	 * Invalidate all game-related queries
	 * Invalidates: game-history, UserAnalytics, userRanking, leaderboard, analytics
	 * @param queryClient React Query client instance
	 */
	invalidateGameQueries(queryClient: QueryClient): void {
		// User analytics
		queryClient.invalidateQueries({ queryKey: ['game-history'] });
		queryClient.invalidateQueries({ queryKey: ['UserAnalytics'] });
		queryClient.invalidateQueries({ queryKey: ['userRanking'] });

		// Leaderboard
		queryClient.invalidateQueries({ queryKey: ['globalLeaderboard'] });
		queryClient.invalidateQueries({ queryKey: ['leaderboardByPeriod'] });

		// Global analytics
		queryClient.invalidateQueries({ queryKey: ['popularTopics'] });
		queryClient.invalidateQueries({ queryKey: ['globalDifficultyStats'] });
		queryClient.invalidateQueries({ queryKey: ['globalStats'] });
		queryClient.invalidateQueries({ queryKey: ['globalTrends'] });
	}

	/**
	 * Invalidate user-related queries
	 * Invalidates: auth, user profile, user preferences
	 * @param queryClient React Query client instance
	 */
	invalidateUserQueries(queryClient: QueryClient): void {
		queryClient.invalidateQueries({ queryKey: ['auth'] });
		queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
		queryClient.invalidateQueries({ queryKey: ['userProfile'] });
		queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
	}

	/**
	 * Invalidate leaderboard queries
	 * Invalidates: leaderboard, globalLeaderboard, leaderboardByPeriod, userRanking
	 * @param queryClient React Query client instance
	 */
	invalidateLeaderboardQueries(queryClient: QueryClient): void {
		queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
		queryClient.invalidateQueries({ queryKey: ['globalLeaderboard'] });
		queryClient.invalidateQueries({ queryKey: ['leaderboardByPeriod'] });
		queryClient.invalidateQueries({ queryKey: ['userRanking'] });
	}

	/**
	 * Invalidate analytics queries
	 * Invalidates: UserAnalytics, popularTopics, globalDifficultyStats, globalStats, globalTrends
	 * @param queryClient React Query client instance
	 */
	invalidateAnalyticsQueries(queryClient: QueryClient): void {
		queryClient.invalidateQueries({ queryKey: ['UserAnalytics'] });
		queryClient.invalidateQueries({ queryKey: ['popularTopics'] });
		queryClient.invalidateQueries({ queryKey: ['globalDifficultyStats'] });
		queryClient.invalidateQueries({ queryKey: ['globalStats'] });
		queryClient.invalidateQueries({ queryKey: ['globalTrends'] });
	}
}

export const queryInvalidationService = new QueryInvalidationService();

