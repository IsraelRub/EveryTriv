import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { GameData, GameHistoryEntry, TriviaRequest } from '@shared/types';
import { extractValidationErrors, getErrorMessage, isRecord } from '@shared/utils';

import { gameHistoryService, gameService, clientLogger as logger } from '@/services';

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
} as const;

/**
 * Hook for getting user game history
 * @param limit Maximum number of entries to return (default: 20)
 * @param offset Pagination offset (default: 0)
 * @returns Query result with game history entries
 */
export const useGameHistory = (limit: number = 20, offset: number = 0) => {
	return useQuery({
		queryKey: ['game-history', limit, offset],
		queryFn: () => gameHistoryService.getUserGameHistory(limit, offset),
		staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
	});
};

/**
 * Hook for saving game history
 * @returns Mutation for saving game result to history
 */
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
			// User analytics
			queryClient.invalidateQueries({ queryKey: ['game-history'] });
			queryClient.invalidateQueries({ queryKey: ['UserAnalytics'] });
			queryClient.invalidateQueries({ queryKey: ['userRanking'] });

			// Leaderboard
			queryClient.invalidateQueries({ queryKey: ['globalLeaderboard'] });
			queryClient.invalidateQueries({ queryKey: ['leaderboardByPeriod'] });

			// Global analytics
			queryClient.invalidateQueries({ queryKey: ['popularTopics'] });
			queryClient.invalidateQueries({ queryKey: ['globalDifficultyStats'] });
			queryClient.invalidateQueries({ queryKey: ['globalStats'] });
			queryClient.invalidateQueries({ queryKey: ['globalTrends'] });
		},
	});
};

/**
 * Hook for fetching trivia questions
 * @returns Mutation for fetching trivia questions based on request
 */
export const useTriviaQuestionMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (request: TriviaRequest) => gameService.getTrivia(request),
		onSuccess: (data, request) => {
			// Cache the result for potential reuse
			queryClient.setQueryData(triviaKeys.question(request), data);
		},
		onError: (error: unknown) => {
			const message = getErrorMessage(error);
			const validationErrors = extractValidationErrors(error);

			let statusCode: number | undefined;
			if (
				isRecord(error) &&
				'statusCode' in error &&
				typeof error.statusCode === 'number' &&
				Number.isFinite(error.statusCode)
			) {
				statusCode = error.statusCode;
			}

			logger.apiError('Trivia request failed', {
				message,
				statusCode,
				errors: validationErrors.length > 0 ? validationErrors : undefined,
			});
		},
	});
};

/**
 * Hook for validating custom difficulty text
 * @returns Validation function for custom difficulty text
 */
export const useValidateCustomDifficulty = () => {
	return (customText: string) => gameService.validateCustomDifficulty(customText);
};

/**
 * Hook for deleting game history entry
 * @returns Mutation for deleting specific game history entry
 */
export const useDeleteGameHistory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (gameId: string) => gameHistoryService.deleteGameHistory(gameId),
		onSuccess: data => {
			// User analytics
			queryClient.invalidateQueries({ queryKey: ['game-history'] });
			queryClient.invalidateQueries({ queryKey: ['UserAnalytics'] });
			queryClient.invalidateQueries({ queryKey: ['userRanking'] });

			// Leaderboard
			queryClient.invalidateQueries({ queryKey: ['globalLeaderboard'] });
			queryClient.invalidateQueries({ queryKey: ['leaderboardByPeriod'] });

			// Global analytics
			queryClient.invalidateQueries({ queryKey: ['popularTopics'] });
			queryClient.invalidateQueries({ queryKey: ['globalDifficultyStats'] });
			queryClient.invalidateQueries({ queryKey: ['globalStats'] });
			queryClient.invalidateQueries({ queryKey: ['globalTrends'] });

			// Show success message
			logger.userInfo('Game history deleted successfully', { message: data });
		},
		onError: error => {
			logger.userError('Failed to delete game history', { error: getErrorMessage(error) });
		},
	});
};

/**
 * Hook for clearing all game history
 * @returns Mutation for clearing all user game history
 */
export const useClearGameHistory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => gameHistoryService.clearGameHistory(),
		onSuccess: data => {
			// User analytics
			queryClient.invalidateQueries({ queryKey: ['game-history'] });
			queryClient.invalidateQueries({ queryKey: ['UserAnalytics'] });
			queryClient.invalidateQueries({ queryKey: ['userRanking'] });

			// Leaderboard
			queryClient.invalidateQueries({ queryKey: ['globalLeaderboard'] });
			queryClient.invalidateQueries({ queryKey: ['leaderboardByPeriod'] });

			// Global analytics
			queryClient.invalidateQueries({ queryKey: ['popularTopics'] });
			queryClient.invalidateQueries({ queryKey: ['globalDifficultyStats'] });
			queryClient.invalidateQueries({ queryKey: ['globalStats'] });
			queryClient.invalidateQueries({ queryKey: ['globalTrends'] });

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
