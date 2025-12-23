/**
 * Admin Game Hooks
 *
 * @module UseAdminGame
 * @description React Query hooks for admin game operations (Admin only)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { UserRole } from '@shared/constants';

import { gameService, clientLogger as logger } from '@/services';

import { selectUserRole } from '@/redux/selectors';

import { useAppSelector } from './useRedux';

/**
 * Hook for getting game statistics (Admin only)
 * @param enabled Whether the query is enabled (default: isAdmin)
 * @returns Query result with game statistics
 */
export const useGameStatistics = (enabled?: boolean) => {
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery({
		queryKey: ['adminGameStatistics'],
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error('Access denied: Admin role required');
			}
			logger.gameInfo('Fetching game statistics');
			const result = await gameService.getGameStatistics();
			logger.gameInfo('Game statistics fetched successfully');
			return result;
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
};

/**
 * Hook for clearing all game history (Admin only)
 * @returns Mutation hook for clearing game history
 */
export const useClearAllGameHistory = () => {
	const queryClient = useQueryClient();
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	return useMutation({
		mutationFn: async () => {
			if (!isAdmin) {
				throw new Error('Access denied: Admin role required');
			}
			logger.gameInfo('Clearing all game history');
			const result = await gameService.clearAllGameHistory();
			logger.gameInfo('All game history cleared successfully', {
				deletedCount: result.deletedCount,
			});
			return result;
		},
		onSuccess: () => {
			// Invalidate related queries
			queryClient.invalidateQueries({ queryKey: ['adminGameStatistics'] });
			queryClient.invalidateQueries({ queryKey: ['gameHistory'] });
			queryClient.invalidateQueries({ queryKey: ['games'] });
		},
	});
};

/**
 * Hook for getting all trivia questions (Admin only)
 * @param enabled Whether the query is enabled (default: isAdmin)
 * @returns Query result with all trivia questions
 */
export const useAllTriviaQuestions = (enabled?: boolean) => {
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	return useQuery({
		queryKey: ['adminAllTriviaQuestions'],
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error('Access denied: Admin role required');
			}
			logger.gameInfo('Fetching all trivia questions');
			const result = await gameService.getAllTriviaQuestions();
			logger.gameInfo('All trivia questions fetched successfully', {
				count: result.totalCount,
			});
			return result;
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
};

/**
 * Hook for clearing all trivia questions (Admin only)
 * @returns Mutation hook for clearing trivia questions
 */
export const useClearAllTrivia = () => {
	const queryClient = useQueryClient();
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	return useMutation({
		mutationFn: async () => {
			if (!isAdmin) {
				throw new Error('Access denied: Admin role required');
			}
			logger.gameInfo('Clearing all trivia questions');
			const result = await gameService.clearAllTrivia();
			logger.gameInfo('All trivia questions cleared successfully', {
				deletedCount: result.deletedCount,
			});
			return result;
		},
		onSuccess: () => {
			// Invalidate related queries
			queryClient.invalidateQueries({ queryKey: ['adminAllTriviaQuestions'] });
			queryClient.invalidateQueries({ queryKey: ['trivia'] });
		},
	});
};
