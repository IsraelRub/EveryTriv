/**
 * Leaderboard Features Hook
 *
 * @module UseLeaderboardFeatures
 * @description React Query hooks for leaderboard features functionality
 */
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { LeaderboardPeriod, TIME_PERIODS_MS } from '@shared/constants';
import { leaderboardService } from '@/services';
import type { RootState } from '@/types';

/**
 * Hook for getting user ranking
 * @returns Query result with user ranking data
 */
export const useUserRanking = () => {
	const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

	return useQuery({
		queryKey: ['userRanking'],
		queryFn: () => leaderboardService.getUserRanking(),
		staleTime: TIME_PERIODS_MS.TWO_MINUTES,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
		enabled: isAuthenticated,
	});
};

/**
 * Hook for getting global leaderboard
 * @param limit Number of users to return (default: VALIDATION_QUANTITY.LEADERBOARD.DEFAULT)
 * @param offset Offset for pagination (default: 0)
 * @returns Query result with global leaderboard data
 */
export const useGlobalLeaderboard = (limit: number = 100, offset: number = 0) => {
	return useQuery({
		queryKey: ['globalLeaderboard', limit, offset],
		queryFn: () => leaderboardService.getGlobalLeaderboard(limit, offset),
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});
};

/**
 * Hook for getting leaderboard by time period
 * @param period Time period (weekly, monthly, yearly)
 * @param limit Number of users to return (default: VALIDATION_QUANTITY.LEADERBOARD.DEFAULT)
 * @param offset Offset for pagination (default: 0)
 * @returns Query result with period leaderboard data
 */
export const useLeaderboardByPeriod = (period: LeaderboardPeriod, limit: number = 100, offset: number = 0) => {
	return useQuery({
		queryKey: ['leaderboardByPeriod', period, limit, offset],
		queryFn: () => leaderboardService.getLeaderboardByPeriod(period, limit, offset),
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});
};
