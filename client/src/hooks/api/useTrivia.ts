import type { CreateGameHistoryDto, GameHistoryEntry, TriviaRequest } from '@shared';
import { clientLogger } from '@shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { selectLeaderboard } from '../../redux/selectors';
import { apiService, gameHistoryService, storageService } from '../../services';
import { useAppSelector } from '../layers/utils';

// Query keys
export const triviaKeys = {
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

// Custom difficulty hooks
export const useCustomDifficulties = () => {
  const getRecentDifficulties = () => storageService.getRecentCustomDifficulties();

  return useQuery({
    queryKey: ['custom-difficulties'],
    queryFn: getRecentDifficulties,
    staleTime: 0, // Always fetch from localStorage
  });
};

// Game History hooks
export const useGameHistory = (limit: number = 20, offset: number = 0) => {
  return useQuery({
    queryKey: ['game-history', limit, offset],
    queryFn: () => gameHistoryService.getUserGameHistory(limit, offset),
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
  });
};

export const useLeaderboard = () => {
  const leaderboard = useAppSelector(selectLeaderboard);

  return {
    data: leaderboard,
    isLoading: false,
    error: null,
    refetch: () => {}, // No need to refetch from API
  };
};

export const useSaveCustomDifficulty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topic, difficulty }: { topic: string; difficulty: string }) => {
      storageService.saveCustomDifficulty(topic, difficulty);
      return Promise.resolve();
    },
    onSuccess: () => {
      // Invalidate custom difficulties query
      queryClient.invalidateQueries({ queryKey: ['custom-difficulties'] });
    },
  });
};

// Mutations
export const useSaveHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGameHistoryDto) => apiService.saveHistory(data),
    onMutate: async newHistory => {
      // Cancel any outgoing refetches
      try {
        await queryClient.cancelQueries({ queryKey: ['game-history'] });
      } catch (error) {
        // Ignore errors when canceling queries
        clientLogger.apiDebug('Error canceling queries', {
          error: error instanceof Error ? error.message : String(error),
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

// Hooks
export const useTriviaQuestion = (request: TriviaRequest) => {
  return useQuery({
    queryKey: triviaKeys.question(request),
    queryFn: () => apiService.getTrivia(request),
    staleTime: 0, // Always fetch fresh questions
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: false, // Don't retry trivia questions
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

export const useUserScore = (userId: string) => {
  return useQuery({
    queryKey: triviaKeys.score(userId),
    queryFn: () => apiService.getUserScore(),
    staleTime: 30 * 1000, // Consider stale after 30 seconds
    enabled: !!userId,
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
    mutationFn: (gameId: string) => apiService.deleteGameHistory(gameId),
    onSuccess: data => {
      // Invalidate game history queries
      queryClient.invalidateQueries({ queryKey: ['game-history'] });
      queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });

      // Show success message
      clientLogger.userInfo('Game history deleted successfully', { message: data.message });
    },
    onError: error => {
      clientLogger.userError('Failed to delete game history', { error });
    },
  });
};

export const useClearGameHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.clearGameHistory(),
    onSuccess: data => {
      // Invalidate all game history queries
      queryClient.invalidateQueries({ queryKey: ['game-history'] });
      queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });

      // Show success message
      clientLogger.userInfo('All game history cleared successfully', {
        deletedCount: data.deletedCount,
      });
    },
    onError: error => {
      clientLogger.userError('Failed to clear game history', { error });
    },
  });
};
