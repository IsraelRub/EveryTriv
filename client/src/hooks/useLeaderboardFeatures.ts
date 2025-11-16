/**
 * Leaderboard Features Hook
 *
 * @module UseLeaderboardFeatures
 * @description React Query hooks for leaderboard features functionality
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { selectLeaderboard } from '../redux/selectors';
import { apiService, gameHistoryService } from '../services';
import { useAppSelector } from './useRedux';

/**
 * Hook for getting user ranking
 * @returns Query result with user ranking data
 */
export const useUserRanking = () => {
	return useQuery({
		queryKey: ['userRanking'],
		queryFn: async () => {
			logger.userInfo('Fetching user ranking');
			const result = await gameHistoryService.getUserRank();
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
 * Hook for updating user ranking
 * @returns Mutation for updating user ranking
 */
export const useUpdateUserRanking = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			logger.userInfo('Updating user ranking');
			return apiService.updateUserRanking();
		},
		onSuccess: data => {
			queryClient.invalidateQueries({ queryKey: ['userRanking'] });
			queryClient.invalidateQueries({ queryKey: ['globalLeaderboard'] });
			queryClient.invalidateQueries({ queryKey: ['leaderboardByPeriod'] });
			logger.userInfo('User ranking updated successfully', { rank: data?.rank, score: data?.score });
		},
		onError: error => {
			logger.userError('Failed to update user ranking', { error: getErrorMessage(error) });
		},
	});
};

/**
 * Hook for getting global leaderboard
 * @param limit Number of users to return
 * @param offset Offset for pagination
 * @returns Query result with global leaderboard data
 */
export const useGlobalLeaderboard = () => {
	const leaderboard = useAppSelector(selectLeaderboard);

	return {
		data: leaderboard,
		isLoading: false,
		error: null,
		refetch: () => {}, // No need to refetch from API
	};
};

/**
 * Hook for getting leaderboard by time period
 * @param period Time period (weekly, monthly, yearly)
 * @param limit Number of users to return
 * @returns Query result with period leaderboard data
 */
export const useLeaderboardByPeriod = (period: 'weekly' | 'monthly', limit: number = 100, offset: number = 0) => {
	return useQuery({
		queryKey: ['leaderboardByPeriod', period, limit, offset],
		queryFn: async () => {
			logger.userInfo('Fetching leaderboard by period', { period, limit, offset });
			const result = await apiService.getLeaderboardByPeriod(period, limit, offset);
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

/**
 * Hook for getting leaderboard statistics for a specific period
 * @param period Time period (weekly, monthly, yearly)
 * @returns Query result with leaderboard statistics
 */
export const useLeaderboardStats = (period: 'weekly' | 'monthly' | 'yearly' = 'weekly') => {
	return useQuery({
		queryKey: ['leaderboardStats', period],
		queryFn: async () => {
			logger.userInfo('Fetching leaderboard stats', { period });
			const result = await apiService.getLeaderboardStats(period);
			logger.userInfo('Leaderboard stats fetched successfully', {
				period,
				activeUsers: result.activeUsers,
			});
			return result;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
};
