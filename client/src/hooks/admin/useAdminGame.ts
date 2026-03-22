import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ERROR_MESSAGES, TIME_PERIODS_MS } from '@shared/constants';

import { QUERY_KEYS } from '@/constants';
import { adminService, apiService, gameService } from '@/services';
import { useUserRole } from '../useAuth';

export const useGameStatistics = (enabled?: boolean) => {
	const { isAdmin } = useUserRole();

	return useQuery({
		queryKey: QUERY_KEYS.admin.gameStatistics(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.getGameStatistics();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useClearAllGameHistory = () => {
	const queryClient = useQueryClient();
	const { isAdmin } = useUserRole();

	return useMutation({
		mutationFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.clearAllGameHistory();
		},
		onSuccess: () => {
			// Invalidate related queries
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.gameStatistics() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.gameHistory() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.games() });
		},
	});
};

export const useAllTriviaQuestions = (enabled?: boolean) => {
	const { isAdmin } = useUserRole();

	return useQuery({
		queryKey: QUERY_KEYS.admin.allTriviaQuestions(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.getAllTriviaQuestions();
		},
		enabled: enabled !== undefined ? enabled && isAdmin : isAdmin,
		staleTime: TIME_PERIODS_MS.HOUR,
		gcTime: TIME_PERIODS_MS.HOUR * 2,
	});
};

export const useClearAllTrivia = () => {
	const queryClient = useQueryClient();
	const { isAdmin } = useUserRole();

	return useMutation({
		mutationFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.clearAllTrivia();
		},
		onSuccess: () => {
			// Invalidate related queries
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.allTriviaQuestions() });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trivia.all });
		},
	});
};

export const useAllUsers = (limit: number = 50, offset: number = 0) => {
	return useQuery({
		queryKey: QUERY_KEYS.admin.users(limit, offset),
		queryFn: () => adminService.getAllUsers(limit, offset),
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});
};

export const useUserSearch = (query: string, limit: number = 50) => {
	const trimmedQuery = query.trim();
	return useQuery({
		queryKey: QUERY_KEYS.admin.userSearch(trimmedQuery, limit),
		queryFn: () => apiService.searchUsers(trimmedQuery, limit),
		enabled: !!trimmedQuery,
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});
};

export const useAiProviderStats = () => {
	return useQuery({
		queryKey: QUERY_KEYS.admin.aiProviderStats(),
		queryFn: () => adminService.getAiProviderStats(),
		staleTime: TIME_PERIODS_MS.TWO_MINUTES,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
	});
};

export const useAiProviderHealth = () => {
	return useQuery({
		queryKey: QUERY_KEYS.admin.aiProviderHealth(),
		queryFn: () => adminService.getAiProviderHealth(),
		staleTime: TIME_PERIODS_MS.THIRTY_SECONDS,
		gcTime: TIME_PERIODS_MS.TWO_MINUTES,
		refetchInterval: TIME_PERIODS_MS.THIRTY_SECONDS,
	});
};
