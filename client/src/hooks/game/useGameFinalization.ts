import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
	AnalyticsAction,
	AnalyticsEventType,
	AnalyticsPageName,
	DEFAULT_GAME_CONFIG,
	GameMode,
	RETRY_LIMITS,
	TIME_PERIODS_MS,
} from '@shared/constants';
import type { CompleteUserAnalytics } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { AudioKey, QUERY_KEYS, ROUTES } from '@/constants';
import type { FinalizeGameOptions } from '@/types';
import { audioService, gameHistoryService, clientLogger as logger, queryInvalidationService } from '@/services';
import {
	selectCorrectAnswers,
	selectCurrentDifficulty,
	selectCurrentGameMode,
	selectCurrentTopic,
	selectGameId,
	selectGameQuestionCount,
	selectGameScore,
	selectTimeSpent,
} from '@/redux/selectors';
import { useTrackAnalyticsEvent } from '../useAnalyticsDashboard';
import { useAppSelector } from '../useRedux';

export const useGameFinalization = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const finalizeGameSessionMutation = useMutation({
		mutationFn: (sessionGameId: string) => gameHistoryService.finalizeGameSession(sessionGameId),
		// Invalidation runs in mutate({ onSuccess }) so we can pass userId / avoid double invalidation vs optimistic update.
		onError: (error: unknown) => {
			const message = getErrorMessage(error);
			logger.gameError('Failed to finalize game session', {
				message,
			});
		},
	});
	const trackAnalyticsEvent = useTrackAnalyticsEvent();

	// Get game state from Redux
	const gameId = useAppSelector(selectGameId);
	const score = useAppSelector(selectGameScore);
	const correctAnswers = useAppSelector(selectCorrectAnswers);
	const gameQuestionCount = useAppSelector(selectGameQuestionCount);
	const timeSpent = useAppSelector(selectTimeSpent);
	const currentTopic = useAppSelector(selectCurrentTopic);
	const currentDifficulty = useAppSelector(selectCurrentDifficulty);
	const currentGameMode = useAppSelector(selectCurrentGameMode);

	const finalizeGame = useCallback(
		(options: FinalizeGameOptions = {}) => {
			const {
				navigateToSummary = true,
				onSuccess,
				onError,
				trackAnalytics = true,
				analyticsProperties = {},
				playErrorSound = false,
				gameId: overrideGameId,
			} = options;

			// Use override gameId (from serverSessionGameIdRef) if provided, otherwise use Redux gameId
			// This prevents mismatches when Redux gameId changes but server session uses different ID
			const sessionGameId = overrideGameId ?? gameId;

			if (!sessionGameId) {
				logger.gameInfo('No gameId found, skipping finalization', {
					overrideGameId: overrideGameId ?? undefined,
					reduxGameId: gameId ?? undefined,
				});
				return;
			}

			if (overrideGameId && gameId && overrideGameId !== gameId) {
				logger.gameInfo('GameId mismatch in finalization - using server session gameId', {
					serverSessionGameId: overrideGameId,
					reduxGameId: gameId,
				});
			}

			const attemptFinalization = (attempt: number = 0): void => {
				// Cancel any outgoing refetches to avoid overwriting optimistic update
				void queryClient.cancelQueries({ queryKey: QUERY_KEYS.analytics.user('current') });

				// Snapshot the previous value for rollback
				const previousAnalytics = queryClient.getQueryData<CompleteUserAnalytics>(QUERY_KEYS.analytics.user('current'));

				// Optimistically update analytics cache if we have current analytics
				if (previousAnalytics?.game) {
					const optimisticAnalytics: CompleteUserAnalytics = {
						...previousAnalytics,
						game: {
							...previousAnalytics.game,
							totalGames: (previousAnalytics.game.totalGames ?? 0) + 1,
							totalQuestionsAnswered: (previousAnalytics.game.totalQuestionsAnswered ?? 0) + (gameQuestionCount ?? 0),
							correctAnswers: (previousAnalytics.game.correctAnswers ?? 0) + (correctAnswers ?? 0),
							totalScore: (previousAnalytics.game.totalScore ?? 0) + (score ?? 0),
							bestScore: Math.max(previousAnalytics.game.bestScore ?? 0, score ?? 0),
							totalPlayTime: (previousAnalytics.game.totalPlayTime ?? 0) + (timeSpent ?? 0),
						},
					};

					queryClient.setQueryData(QUERY_KEYS.analytics.user('current'), optimisticAnalytics, {
						updatedAt: Date.now(),
					});
				}

				finalizeGameSessionMutation.mutate(sessionGameId, {
					onSuccess: async savedHistory => {
						logger.gameInfo(`Game session finalized ${options.logContext ? ` - ${options.logContext}` : ''}`, {
							gameId: sessionGameId,
							score,
							correctAnswers,
						});

						// Track analytics event if enabled
						if (trackAnalytics) {
							trackAnalyticsEvent.mutate({
								eventType: AnalyticsEventType.GAME_COMPLETE,
								page: AnalyticsPageName.GAME_SUMMARY,
								action: AnalyticsAction.GAME_FINALIZED,
								value: score,
								properties: {
									topic: currentTopic ?? DEFAULT_GAME_CONFIG.defaultTopic,
									difficulty: currentDifficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty,
									gameMode: currentGameMode ?? GameMode.QUESTION_LIMITED,
									correctAnswers,
									totalQuestions: gameQuestionCount ?? 0,
									timeSpent,
									...analyticsProperties,
								},
							});
						}

						// Invalidate all relevant queries immediately after successful finalization
						// This ensures fresh data on next view, especially important for StatisticsView
						const userId = savedHistory?.userId;
						if (userId) {
							await queryInvalidationService.invalidateAfterGameComplete(queryClient, userId);
						} else {
							await Promise.all([
								queryInvalidationService.invalidateGameQueries(queryClient),
								queryInvalidationService.invalidateAnalyticsQueries(queryClient),
								queryInvalidationService.invalidateLeaderboardQueries(queryClient),
							]);
						}

						// Navigate to summary if requested (URL includes gameId for consistency with multiplayer)
						if (navigateToSummary) {
							navigate(ROUTES.GAME_SINGLE_SUMMARY.replace(':gameId', sessionGameId));
						}

						// Execute custom success callback with saved history
						onSuccess?.(savedHistory);
					},
					onError: error => {
						// Rollback optimistic update on error
						if (previousAnalytics) {
							queryClient.setQueryData(QUERY_KEYS.analytics.user('current'), previousAnalytics, {
								updatedAt: Date.now(),
							});
						}

						const message = getErrorMessage(error);
						if (
							(/(network|timeout)/i.test(message) || error instanceof TypeError) &&
							attempt < RETRY_LIMITS.gameSessionFinalization
						) {
							// Retry after exponential backoff
							const delay = 2 ** attempt * TIME_PERIODS_MS.SECOND; // 1s, 2s, 4s
							setTimeout(() => {
								logger.gameInfo('Retrying game finalization', {
									attempt: attempt + 1,
									delay,
									gameId: sessionGameId,
								});
								attemptFinalization(attempt + 1);
							}, delay);
						} else {
							// Final failure - show error to user
							const errorLogMessage = `Failed to finalize game session${options.logContext ? ` - ${options.logContext}` : ''}`;
							logger.gameError(errorLogMessage, {
								gameId: sessionGameId,
								errorInfo: { message },
								attempt: attempt + 1,
							});

							if (playErrorSound) {
								audioService.play(AudioKey.ERROR);
							}

							// Execute custom error callback
							onError?.(error);
						}
					},
				});
			};

			attemptFinalization();
		},
		[
			gameId,
			score,
			correctAnswers,
			gameQuestionCount,
			timeSpent,
			currentTopic,
			currentDifficulty,
			currentGameMode,
			finalizeGameSessionMutation,
			trackAnalyticsEvent,
			navigate,
			queryClient,
		]
	);

	return {
		finalizeGameSession: finalizeGame,
		isFinalizing: finalizeGameSessionMutation.isPending,
	};
};
