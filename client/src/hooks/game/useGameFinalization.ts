import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { AnalyticsAction, AnalyticsEventType, AnalyticsPageName, DifficultyLevel, GameMode } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { AudioKey, ROUTES } from '@/constants';
import { audioService, clientLogger as logger } from '@/services';
import type { FinalizeGameOptions } from '@/types';
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
import { useFinalizeGameSession } from './useTrivia';

export const useGameFinalization = () => {
	const navigate = useNavigate();
	const finalizeGameSessionMutation = useFinalizeGameSession();
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
			} = options;

			if (!gameId) {
				logger.gameInfo('No gameId found, skipping finalization');
				return;
			}

			finalizeGameSessionMutation.mutate(gameId, {
				onSuccess: savedHistory => {
					const logMessage = options.logContext
						? `Game session finalized - ${options.logContext}`
						: 'Game session finalized';
					logger.gameInfo(logMessage, {
						gameId,
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
								topic: currentTopic ?? 'General',
								difficulty: currentDifficulty ?? DifficultyLevel.MEDIUM,
								gameMode: currentGameMode ?? GameMode.QUESTION_LIMITED,
								correctAnswers,
								totalQuestions: gameQuestionCount ?? 0,
								timeSpent,
								...analyticsProperties,
							},
						});
					}

					// Navigate to summary if requested
					if (navigateToSummary) {
						navigate(ROUTES.GAME_SUMMARY);
					}

					// Execute custom success callback with saved history
					onSuccess?.(savedHistory);
				},
				onError: error => {
					const message = getErrorMessage(error);
					const errorLogMessage = options.logContext
						? `Failed to finalize game session - ${options.logContext}`
						: 'Failed to finalize game session';
					logger.gameError(errorLogMessage, {
						gameId,
						errorInfo: { message },
					});

					if (playErrorSound) {
						audioService.play(AudioKey.ERROR);
					}

					// Execute custom error callback
					onError?.(error);
				},
			});
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
		]
	);

	return {
		finalizeGameSession: finalizeGame,
		isFinalizing: finalizeGameSessionMutation.isPending,
	};
};
