/**
 * User Stats Hook
 *
 * @module UseUserStats
 * @description React Query hook for user statistics
 */
import { useQuery } from '@tanstack/react-query';

import { clientLogger as logger } from '@shared/services';

import { gameHistoryService } from '../services';

/**
 * Hook for getting user statistics
 * @returns Query result with user statistics
 */
export const useUserStats = () => {
	return useQuery({
		queryKey: ['userStats'],
		queryFn: async () => {
			logger.userInfo('Fetching user statistics');
			const result = await gameHistoryService.getUserStats();
			logger.userInfo('User statistics fetched successfully', {
				totalGames: result.gamesPlayed,
				totalScore: result.correctAnswers,
				averageScore: result.averageScore,
			});
			return result;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
};
