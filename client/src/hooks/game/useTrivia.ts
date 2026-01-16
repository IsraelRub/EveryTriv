import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { GameMode, TIME_PERIODS_MS } from '@shared/constants';
import type { GameDifficulty, SubmitAnswerToSessionParams, TriviaRequest } from '@shared/types';
import { extractValidationErrors, getErrorMessage, isRecord } from '@shared/utils';

import { QUERY_KEYS } from '@/constants';
import { gameHistoryService, gameService, clientLogger as logger, queryInvalidationService } from '@/services';
import { useIsAuthenticated } from '../useAuth';

export const useGameHistory = (limit: number = 20, offset: number = 0) => {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: QUERY_KEYS.trivia.gameHistory('current', limit, offset),
		queryFn: () => gameHistoryService.getUserGameHistory(limit, offset),
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		enabled: isAuthenticated,
	});
};

export const useTriviaQuestionMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (request: TriviaRequest) => gameService.getTrivia(request),
		onSuccess: (data, request) => {
			// Cache the result for potential reuse
			queryClient.setQueryData(QUERY_KEYS.trivia.question(request), data);
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
				httpStatus: { code: statusCode },
				errorInfo: {
					messages: validationErrors.length > 0 ? validationErrors : undefined,
				},
			});
		},
	});
};

export const useValidateCustomDifficulty = () => {
	return (customText: string) => gameService.validateCustomDifficulty(customText);
};

export const useDeleteGameHistory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (gameId: string) => gameHistoryService.deleteGameHistory(gameId),
		onSuccess: () => {
			queryInvalidationService.invalidateGameQueries(queryClient);
		},
	});
};

export const useClearGameHistory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => gameHistoryService.clearGameHistory(),
		onSuccess: () => {
			queryInvalidationService.invalidateGameQueries(queryClient);
		},
	});
};

export const useStartGameSession = () => {
	return useMutation({
		mutationFn: (params: { gameId: string; topic: string; difficulty: GameDifficulty; gameMode: GameMode }) =>
			gameHistoryService.startGameSession(params.gameId, params.topic, params.difficulty, params.gameMode),
		onError: (error: unknown) => {
			const message = getErrorMessage(error);
			logger.gameError('Failed to start game session', {
				message,
			});
		},
	});
};

export const useSubmitAnswerToSession = () => {
	return useMutation({
		mutationFn: (params: SubmitAnswerToSessionParams) =>
			gameHistoryService.submitAnswerToSession(params.gameId, params.questionId, params.answer, params.timeSpent),
		onError: (error: unknown) => {
			const message = getErrorMessage(error);
			logger.gameError('Failed to submit answer to session', {
				message,
			});
		},
	});
};

export const useFinalizeGameSession = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (gameId: string) => gameHistoryService.finalizeGameSession(gameId),
		onSuccess: () => {
			queryInvalidationService.invalidateGameQueries(queryClient);
		},
		onError: (error: unknown) => {
			const message = getErrorMessage(error);
			logger.gameError('Failed to finalize game session', {
				message,
			});
		},
	});
};
