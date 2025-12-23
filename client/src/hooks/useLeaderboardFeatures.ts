/**
 * Leaderboard Features Hook
 *
 * @module UseLeaderboardFeatures
 * @description React Query hooks for leaderboard features functionality
 */
import { useQuery } from '@tanstack/react-query';

import { LeaderboardPeriod } from '@shared/constants';

import { leaderboardService, clientLogger as logger } from '@/services';

/**
 * Hook for getting user ranking
 * @returns Query result with user ranking data
 */
export const useUserRanking = () => {
	return useQuery({
		queryKey: ['userRanking'],
		queryFn: async () => {
			logger.userInfo('Fetching user ranking');
			const result = await leaderboardService.getUserRanking();
			logger.userInfo('User ranking fetched successfully', {
				rank: result?.rank,
				score: result?.score,
			});
			return result;
		},
		staleTime: 2 * 60 * 1000, // 2 minutes - rankings can change frequently
		gcTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook for getting global leaderboard
 * @param limit Number of users to return (default: 100)
 * @param offset Offset for pagination (default: 0)
 * @returns Query result with global leaderboard data
 */
export const useGlobalLeaderboard = (limit: number = 100, offset: number = 0) => {
	return useQuery({
		queryKey: ['globalLeaderboard', limit, offset],
		queryFn: async () => {
			logger.userInfo('Fetching global leaderboard', { limit, offset });
			const result = await leaderboardService.getGlobalLeaderboard(limit, offset);
			logger.userInfo('Global leaderboard fetched successfully', {
				count: result.length,
			});
			return result;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
};

/**
 * Hook for getting leaderboard by time period
 * @param period Time period (weekly, monthly, yearly)
 * @param limit Number of users to return (default: 100)
 * @param offset Offset for pagination (default: 0)
 * @returns Query result with period leaderboard data
 */
export const useLeaderboardByPeriod = (period: LeaderboardPeriod, limit: number = 100, offset: number = 0) => {
	return useQuery({
		queryKey: ['leaderboardByPeriod', period, limit, offset],
		queryFn: async () => {
			logger.userInfo('Fetching leaderboard by period', { period, limit, offset });
			const result = await leaderboardService.getLeaderboardByPeriod(period, limit, offset);
			logger.userInfo('Leaderboard fetched successfully', {
				period,
				count: result.length,
			});
			return result;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
};
