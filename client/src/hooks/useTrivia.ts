import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clientLogger as logger } from '@shared/services';
import type { GameData, GameHistoryEntry, TriviaRequest } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { apiService, gameHistoryService } from '../services';

// Query keys
const triviaKeys = {
	all: ['trivia'] as const,
	lists: () => [...triviaKeys.all, 'list'] as const,
	list: (filters: string) => [...triviaKeys.lists(), { filters }] as const,
	details: () => [...triviaKeys.all, 'detail'] as const,
	detail: (id: number) => [...triviaKeys.details(), id] as const,
	history: () => [...triviaKeys.all, 'history'] as const,
	question: (request: TriviaRequest) => [...triviaKeys.all, 'question', request] as const,
	score: (userId: string) => [...triviaKeys.all, 'score', userId] as const,
	leaderboard: (limit: number) => [...triviaKeys.all, 'leaderboard', limit] as const,
	difficultyStats: (userId?: string) => [...triviaKeys.all, 'difficulty-stats', userId] as const,
} as const;

// Game History hooks
export const useGameHistory = (limit: number = 20, offset: number = 0) => {
	return useQuery({
		queryKey: ['game-history', limit, offset],
		queryFn: () => gameHistoryService.getUserGameHistory(limit, offset),
		staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
	});
};

// Mutations
export const useSaveHistory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: GameData) => gameHistoryService.saveGameResult(data),
		onMutate: async newHistory => {
			// Cancel any outgoing refetches
			try {
				await queryClient.cancelQueries({ queryKey: ['game-history'] });
			} catch (error) {
				// Ignore errors when canceling queries
				logger.apiDebug('Error canceling queries', {
					error: getErrorMessage(error),
				});
			}

			// Snapshot the previous value
			const previousHistory = queryClient.getQueryData(['game-history']);

			// Optimistically update the cache
			queryClient.setQueryData(['game-history'], (old: GameHistoryEntry[] | undefined) => {
				if (!old) return [newHistory];
				return [newHistory, ...old];
			});

			// Return a context object with the snapshotted value
			return { previousHistory };
		},
		onError: (_err, _newHistory, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousHistory) {
				queryClient.setQueryData(['game-history'], context.previousHistory);
			}
		},
		onSettled: () => {
			// Always refetch after error or success
			queryClient.invalidateQueries({ queryKey: ['game-history'] });
			queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });
		},
	});
};

// Specialized hook for game scenarios that returns a function to fetch trivia
export const useTriviaQuestionMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (request: TriviaRequest) => apiService.getTrivia(request),
		onSuccess: (data, request) => {
			// Cache the result for potential reuse
			queryClient.setQueryData(triviaKeys.question(request), data);
		},
	});
};

// Validation hook
export const useValidateCustomDifficulty = () => {
	return (customText: string) => apiService.validateCustomDifficulty(customText);
};

// Game History Management hooks
export const useDeleteGameHistory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (gameId: string) => gameHistoryService.deleteGameHistory(gameId),
		onSuccess: data => {
			// Invalidate game history queries
			queryClient.invalidateQueries({ queryKey: ['game-history'] });
			queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });

			// Show success message
			logger.userInfo('Game history deleted successfully', { message: data.message });
		},
		onError: error => {
			logger.userError('Failed to delete game history', { error: getErrorMessage(error) });
		},
	});
};

export const useClearGameHistory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => gameHistoryService.clearGameHistory(),
		onSuccess: data => {
			// Invalidate all game history queries
			queryClient.invalidateQueries({ queryKey: ['game-history'] });
			queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });

			// Show success message
			logger.userInfo('All game history cleared successfully', {
				deletedCount: data.deletedCount,
			});
		},
		onError: error => {
			logger.userError('Failed to clear game history', { error: getErrorMessage(error) });
		},
	});
};
