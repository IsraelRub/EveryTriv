/**
 * Admin Game Hooks
 *
 * @module UseAdminGame
 * @description React Query hooks for admin game operations (Admin only)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ERROR_MESSAGES, TIME_PERIODS_MS, UserRole } from '@shared/constants';
import { gameService } from '@/services';
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
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.getGameStatistics();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
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
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.clearAllGameHistory();
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
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.getAllTriviaQuestions();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
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
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.clearAllTrivia();
		},
		onSuccess: () => {
			// Invalidate related queries
			queryClient.invalidateQueries({ queryKey: ['adminAllTriviaQuestions'] });
			queryClient.invalidateQueries({ queryKey: ['trivia'] });
		},
	});
};
