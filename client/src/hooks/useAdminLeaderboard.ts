/**
 * Admin Leaderboard Hooks
 *
 * @module UseAdminLeaderboard
 * @description React Query hooks for admin leaderboard operations (Admin only)
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ERROR_MESSAGES, UserRole } from '@shared/constants';
import { leaderboardService, queryInvalidationService, clientLogger as logger } from '@/services';
import { selectUserRole } from '@/redux/selectors';
import { useAppSelector } from './useRedux';

/**
 * Hook for clearing all leaderboard data (Admin only)
 * @returns Mutation hook for clearing leaderboard
 */
export const useClearAllLeaderboard = () => {
	const queryClient = useQueryClient();
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	return useMutation({
		mutationFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			logger.gameStatistics('Clearing all leaderboard data');
			const result = await leaderboardService.clearAllLeaderboard();
			logger.gameStatistics('All leaderboard data cleared successfully', {
				deletedCount: result.deletedCount,
			});
			return result;
		},
		onSuccess: () => {
			// Invalidate related queries
			queryInvalidationService.invalidateLeaderboardQueries(queryClient);
		},
	});
};
