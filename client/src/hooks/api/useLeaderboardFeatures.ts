/**
 * Leaderboard Features Hook
 *
 * @module UseLeaderboardFeatures
 * @description React Query hooks for leaderboard features functionality
 */
import { clientLogger } from '@shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { selectLeaderboard } from '../../redux/selectors';
import { apiService } from '../../services/api';
import { useAppSelector } from '../layers/utils';

/**
 * Hook for getting user ranking
 * @returns Query result with user ranking data
 */
export const useUserRanking = () => {
  return useQuery({
    queryKey: ['userRanking'],
    queryFn: async () => {
      clientLogger.userInfo('Fetching user ranking');
      const result = await apiService.getUserRanking();
      clientLogger.userInfo('User ranking fetched successfully', {
        rank: result.rank,
        score: result.score,
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
      clientLogger.userInfo('Updating user ranking');
      return apiService.updateUserRanking();
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['userRanking'] });
      queryClient.invalidateQueries({ queryKey: ['globalLeaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboardByPeriod'] });
      clientLogger.userInfo('User ranking updated successfully', { message: data.message });
    },
    onError: error => {
      clientLogger.userError('Failed to update user ranking', { error });
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
export const useLeaderboardByPeriod = (
  period: 'weekly' | 'monthly' | 'yearly',
  limit: number = 100
) => {
  return useQuery({
    queryKey: ['leaderboardByPeriod', period, limit],
    queryFn: async () => {
      clientLogger.userInfo('Fetching leaderboard by period', { period, limit });
      const result = await apiService.getLeaderboardByPeriod(period, limit);
      clientLogger.userInfo('Leaderboard by period fetched successfully', {
        period,
        count: result.length,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
