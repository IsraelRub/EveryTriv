import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
	AnalyticsAction,
	AnalyticsEventType,
	AnalyticsPageName,
	DEFAULT_GAME_CONFIG,
	ERROR_MESSAGES,
	GAME_MODES_CONFIG,
	GameMode,
	TIME_PERIODS_MS,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { StartGameSessionParams, SubmitAnswerToSessionParams, TriviaQuestion } from '@shared/types';
import {
	calculateElapsedSeconds,
	createAnswerHistory,
	extractValidationErrors,
	getErrorMessage,
	hasProperty,
	isNonEmptyString,
	isRecord,
	shouldChargeAfterGame,
} from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { AudioKey, ExitReason, LoadingMessages, QUERY_KEYS, ROUTES } from '@/constants';
import type { TriviaRequestWithSignal, UseSingleSessionReturn } from '@/types';
import { audioService, gameHistoryService, gameService, clientLogger as logger } from '@/services';
import {
	getSingleSessionCompletionState,
	getSingleSessionCreditDeductionValue,
	getSingleSessionExpectedQuestionCount,
	getSingleSessionGameModeFlags,
	getSingleSessionQuestionsPerRequest,
	isTriviaGenerationDeclinedLoadError,
} from '@/utils';
import {
	useAppDispatch,
	useAppSelector,
	useCreditBalance,
	useCurrentUserData,
	useDeductCredits,
	useGameFinalization,
	useTrackAnalyticsEvent,
	useUserRole,
} from '@/hooks';
import { useNavigationClose } from '@/hooks/ui/useNavigationClose';
import {
	selectAnswered,
	selectCorrectAnswers,
	selectCreditsDeducted,
	selectCurrentDifficulty,
	selectCurrentGameMode,
	selectCurrentQuestion,
	selectCurrentQuestionIndex,
	selectCurrentSettings,
	selectCurrentTopic,
	selectGameId,
	selectGameLoading,
	selectGameLoadingStep,
	selectGameQuestionCount,
	selectGameQuestions,
	selectGameScore,
	selectGameStartTime,
	selectIsGameFinalized,
	selectLastScoreEarned,
	selectLocale,
	selectSelectedAnswer,
	selectStreak,
} from '@/redux/selectors';
import {
	addAnswerHistory,
	appendQuestions,
	ensureGameStartTime,
	finalizeGame,
	moveToNextQuestion as moveToNextQuestionAction,
	resetGameSession,
	selectAnswer,
	setAnswered,
	setAnswerHistory,
	setCreditsDeducted,
	setGameQuestionCount,
	setLoading,
	setQuestionIndex,
	setQuestions,
	startGameSession,
	syncGameId,
	updateScore,
	updateTimeSpent,
} from '@/redux/slices';

export function useSingleSession(): UseSingleSessionReturn {
	const { gameId: urlGameId } = useParams<{ gameId: string }>();
	const navigate = useNavigate();
	const { handleClose } = useNavigationClose({ defaultRoute: ROUTES.HOME });
	const currentUser = useCurrentUserData();
	const dispatch = useAppDispatch();
	const currentTopic = useAppSelector(selectCurrentTopic);
	const currentDifficulty = useAppSelector(selectCurrentDifficulty);
	const currentGameMode = useAppSelector(selectCurrentGameMode);
	const currentSettings = useAppSelector(selectCurrentSettings);
	const { isAdmin } = useUserRole();

	const gameModeForUtils = currentGameMode ?? GameMode.QUESTION_LIMITED;
	const { isQuestionLimited, isTimeLimited, isUnlimited, hasQuestionLimit } =
		getSingleSessionGameModeFlags(gameModeForUtils);

	const maxQuestionsPerGame =
		currentSettings?.maxQuestionsPerGame ?? GAME_MODES_CONFIG[currentGameMode]?.defaults.maxQuestionsPerGame;

	const timeLimit =
		currentSettings?.timeLimit ??
		(currentGameMode ? GAME_MODES_CONFIG[currentGameMode]?.defaults.timeLimit : undefined) ??
		VALIDATION_COUNT.TIME_LIMIT.DEFAULT;

	const deductCredits = useDeductCredits();

	const gameId = useAppSelector(selectGameId);
	const currentQuestionIndex = useAppSelector(selectCurrentQuestionIndex);
	const gameQuestionCount = useAppSelector(selectGameQuestionCount);
	const score = useAppSelector(selectGameScore);
	const correctAnswers = useAppSelector(selectCorrectAnswers);
	const questions = useAppSelector(selectGameQuestions);
	const loading = useAppSelector(selectGameLoading);
	const loadingStep = useAppSelector(selectGameLoadingStep);
	const gameStartTime = useAppSelector(selectGameStartTime);
	const selectedAnswer = useAppSelector(selectSelectedAnswer);
	const answered = useAppSelector(selectAnswered);
	const streak = useAppSelector(selectStreak);
	const isGameFinalized = useAppSelector(selectIsGameFinalized);
	const creditsDeducted = useAppSelector(selectCreditsDeducted);
	const lastScoreEarned = useAppSelector(selectLastScoreEarned);
	const currentQuestion = useAppSelector(selectCurrentQuestion);
	const locale = useAppSelector(selectLocale);

	useEffect(() => {
		if (!urlGameId || serverSessionGameIdRef.current) return;
		if (gameId !== urlGameId) {
			dispatch(syncGameId(urlGameId));
			if (!gameId) {
				dispatch(setLoading({ loading: false, loadingStep: LoadingMessages.CONNECTING }));
			}
		}
	}, [urlGameId, gameId, dispatch]);

	useEffect(() => {
		const refId = serverSessionGameIdRef.current;
		if (refId && gameId !== refId) {
			dispatch(syncGameId(refId));
		}
	}, [gameId, loading, dispatch]);

	const lastSessionErrorRef = useRef<unknown>(null);

	const [showErrorDialog, setShowErrorDialog] = useState(false);
	const [sessionError, setSessionError] = useState<unknown | null>(null);

	const setDialogError = useCallback((error: unknown) => {
		lastSessionErrorRef.current = error;
		setSessionError(error);
	}, []);

	const clearDialogError = useCallback(() => {
		lastSessionErrorRef.current = null;
		setSessionError(null);
	}, []);

	const handleSafeExitFromLoading = useCallback(() => {
		const err = lastSessionErrorRef.current;
		lastSessionErrorRef.current = null;
		setSessionError(null);
		setShowErrorDialog(false);
		dispatch(resetGameSession());
		if (isTriviaGenerationDeclinedLoadError(err)) {
			navigate(ROUTES.GAME_SINGLE);
			return;
		}
		handleClose();
	}, [dispatch, handleClose, navigate]);
	const [showCreditsWarning, setShowCreditsWarning] = useState(false);

	const questionsLoadedRef = useRef(false);
	const isLoadingRef = useRef(false);
	const loadInProgressRef = useRef(false);
	const serverSessionGameIdRef = useRef<string | null>(null);
	const loadGenerationRef = useRef(0);
	const creditsDeductionFailedRef = useRef(false);

	const prevSettingsRef = useRef<{ topic: string; difficulty: string; mode: GameMode }>({
		topic: '',
		difficulty: '',
		mode: GameMode.QUESTION_LIMITED,
	});
	const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const answerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const fetchingQuestionsHintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const initialLoadValuesRef = useRef<{
		maxQuestionsPerGame: number | undefined;
		answerCount: number | undefined;
		hasQuestionLimit: boolean;
	} | null>(null);

	const { data: creditBalance } = useCreditBalance();
	const queryClient = useQueryClient();

	const triviaMutation = useMutation({
		mutationFn: (request: TriviaRequestWithSignal) => gameService.getTrivia(request),
		onSuccess: (data, request) => {
			const cacheRequest: TriviaRequestWithSignal = { ...request };
			Reflect.deleteProperty(cacheRequest, 'signal');
			queryClient.setQueryData(QUERY_KEYS.trivia.question(cacheRequest), data);
		},
		onError: (error: unknown) => {
			const message = getErrorMessage(error);

			const isAbortError =
				message === 'Request was cancelled' ||
				message.includes('aborted') ||
				message === 'signal is aborted without reason' ||
				(isRecord(error) &&
					'statusCode' in error &&
					error.statusCode === 0 &&
					hasProperty(error, 'details') &&
					isRecord(error.details) &&
					error.details.error === 'Request was cancelled');

			if (isAbortError) {
				return;
			}

			const validationErrors = extractValidationErrors(error);

			let statusCode: number | undefined;
			if (isRecord(error) && 'statusCode' in error && VALIDATORS.number(error.statusCode)) {
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

	const startGameSessionMutation = useMutation({
		mutationFn: (params: StartGameSessionParams) =>
			gameHistoryService.startGameSession(
				params.gameId,
				params.topic,
				params.difficulty,
				params.gameMode,
				params.outputLanguage
			),
		onError: (error: unknown) => {
			const message = getErrorMessage(error);
			logger.gameError('Failed to start game session', {
				message,
			});
		},
	});

	const submitAnswerToSessionMutation = useMutation({
		mutationFn: (params: SubmitAnswerToSessionParams) =>
			gameHistoryService.submitAnswerToSession(params.gameId, params.questionId, params.answer, params.timeSpent),
		onError: (error: unknown) => {
			const message = getErrorMessage(error);
			logger.gameError('Failed to submit answer to session', {
				message,
			});
		},
	});
	const { finalizeGameSession, isFinalizing } = useGameFinalization();
	const [showSummaryLoading, setShowSummaryLoading] = useState(false);
	const [exitReason, setExitReason] = useState<ExitReason | null>(null);
	const [isFetchingMoreQuestions, setIsFetchingMoreQuestions] = useState(false);
	const trackAnalyticsEvent = useTrackAnalyticsEvent();

	useEffect(() => {
		if (!gameId && serverSessionGameIdRef.current) {
			serverSessionGameIdRef.current = null;
		}
		if (isGameFinalized && serverSessionGameIdRef.current) {
			serverSessionGameIdRef.current = null;
			questionsLoadedRef.current = false;
			initialLoadValuesRef.current = null;
		}
	}, [isGameFinalized, gameId]);

	const progress = hasQuestionLimit && gameQuestionCount ? ((currentQuestionIndex + 1) / gameQuestionCount) * 100 : 0;

	const isChargeAfterGame = shouldChargeAfterGame(currentGameMode);

	useEffect(() => {
		if (questions.length === 0) {
			creditsDeductionFailedRef.current = false;
		}
	}, [questions.length]);

	useEffect(() => {
		if (!gameId) {
			creditsDeductionFailedRef.current = false;
		}
	}, [gameId]);

	useEffect(() => {
		if (
			isAdmin ||
			isChargeAfterGame ||
			creditsDeducted ||
			questions.length === 0 ||
			deductCredits.isPending ||
			creditsDeductionFailedRef.current
		) {
			if (isChargeAfterGame && !creditsDeducted && questions.length > 0) {
				dispatch(setCreditsDeducted(true));
			}
			return;
		}

		const gameMode = currentGameMode ?? GameMode.QUESTION_LIMITED;
		const valueForDeduction = getSingleSessionCreditDeductionValue({
			gameMode,
			timeLimit,
			maxQuestionsPerGame,
		});

		logger.gameInfo('Deducting credits for game', {
			questionsPerRequest: valueForDeduction,
			gameMode,
		});

		deductCredits.mutate(
			{
				questionsPerRequest: valueForDeduction,
				gameMode,
			},
			{
				onSuccess: () => {
					dispatch(setCreditsDeducted(true));
					logger.gameInfo('Credits deducted successfully');
				},
				onError: error => {
					creditsDeductionFailedRef.current = true;
					dispatch(setCreditsDeducted(false));
					const message = getErrorMessage(error);
					logger.gameError('Failed to deduct credits', { errorInfo: { message } });
					audioService.play(AudioKey.ERROR);
					setDialogError(error);
					setShowErrorDialog(true);
				},
			}
		);
	}, [
		isAdmin,
		isChargeAfterGame,
		creditsDeducted,
		questions.length,
		currentGameMode,
		maxQuestionsPerGame,
		timeLimit,
		isTimeLimited,
		isUnlimited,
		deductCredits.isPending,
		deductCredits,
		dispatch,
		gameId,
		setDialogError,
	]);

	useEffect(() => {
		const settingsChanged =
			prevSettingsRef.current.topic !== currentTopic ||
			prevSettingsRef.current.difficulty !== currentDifficulty ||
			prevSettingsRef.current.mode !== currentGameMode;

		if (settingsChanged) {
			questionsLoadedRef.current = false;
			isLoadingRef.current = false;
			initialLoadValuesRef.current = null;
			if (gameId && questions.length > 0) {
				dispatch(resetGameSession());
				serverSessionGameIdRef.current = null;
			}
			prevSettingsRef.current = { topic: currentTopic, difficulty: currentDifficulty, mode: currentGameMode };
		}
	}, [currentTopic, currentDifficulty, currentGameMode, dispatch, gameId, questions.length]);

	useEffect(() => {
		if (loadInProgressRef.current || questionsLoadedRef.current) {
			return;
		}
		loadInProgressRef.current = true;

		if (isGameFinalized) {
			loadInProgressRef.current = false;
			return;
		}

		if (questions.length > 0 && gameId && !isGameFinalized) {
			initialLoadValuesRef.current ??= {
				maxQuestionsPerGame,
				answerCount: currentSettings?.answerCount,
				hasQuestionLimit,
			};
			questionsLoadedRef.current = true;
			loadInProgressRef.current = false;
			return;
		}

		isLoadingRef.current = true;
		loadGenerationRef.current += 1;
		const thisLoadGeneration = loadGenerationRef.current;
		let ignore = false;

		const abortController = new AbortController();

		const loadQuestions = async () => {
			try {
				if (ignore) return;
				dispatch(setLoading({ loading: true, loadingStep: LoadingMessages.CONNECTING }));
				clearDialogError();
				setShowErrorDialog(false);

				let sessionGameId = urlGameId ?? gameId;
				if (!sessionGameId) {
					sessionGameId = crypto.randomUUID();
					const initialGameQuestionCount =
						hasQuestionLimit && maxQuestionsPerGame != null ? maxQuestionsPerGame : undefined;
					dispatch(startGameSession({ gameId: sessionGameId, gameQuestionCount: initialGameQuestionCount }));
				}

				const questionsPerRequestForAPI = getSingleSessionQuestionsPerRequest({
					gameMode: gameModeForUtils,
					maxQuestionsPerGame,
					gameQuestionCount,
				});

				const expectedQuestionCount = getSingleSessionExpectedQuestionCount({
					gameMode: gameModeForUtils,
					gameQuestionCount,
					maxQuestionsPerGame,
				});

				logger.gameInfo('Loading trivia questions', {
					topic: currentTopic || DEFAULT_GAME_CONFIG.defaultTopic,
					difficulty: currentDifficulty || DEFAULT_GAME_CONFIG.defaultDifficulty,
					questionsPerRequest: questionsPerRequestForAPI,
					...(expectedQuestionCount !== undefined && { expectedQuestionCount }),
				});

				if (ignore) return;
				if (currentUser?.id && sessionGameId) {
					dispatch(setLoading({ loading: true, loadingStep: LoadingMessages.INITIALIZING_SESSION }));
					const sessionStartPromise = startGameSessionMutation.mutateAsync({
						gameId: sessionGameId,
						topic: currentTopic ?? DEFAULT_GAME_CONFIG.defaultTopic,
						difficulty: currentDifficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty,
						gameMode: currentGameMode ?? GameMode.QUESTION_LIMITED,
						outputLanguage: locale,
					});
					const sessionStartTimeoutMs = 15 * TIME_PERIODS_MS.SECOND;
					const timeoutPromise = new Promise<never>((_, reject) => {
						setTimeout(() => reject(new Error('Session start timed out')), sessionStartTimeoutMs);
					});
					try {
						await Promise.race([sessionStartPromise, timeoutPromise]);
						if (ignore) return;
						if (thisLoadGeneration === loadGenerationRef.current) {
							serverSessionGameIdRef.current = sessionGameId;
							logger.gameInfo('Server session gameId stored (before trivia fetch)', {
								serverSessionGameId: sessionGameId,
								reduxGameId: gameId ?? undefined,
							});
						}
					} catch (sessionError) {
						if (ignore) return;
						const sessionErrorMessage = getErrorMessage(sessionError);
						const isTimeout =
							sessionErrorMessage.includes('timed out') || sessionErrorMessage.includes('Session start timed out');
						logger.gameError('Failed to start game session on server', {
							errorInfo: { message: sessionErrorMessage },
							gameId: sessionGameId,
						});
						serverSessionGameIdRef.current = null;
						throw new Error(
							isTimeout
								? ERROR_MESSAGES.api.TRIVIA_GENERATION_SLOW_OR_RATE_LIMIT
								: ERROR_MESSAGES.game.FAILED_TO_INITIALIZE_GAME_SESSION(sessionErrorMessage)
						);
					}
				}

				if (ignore) return;
				if (fetchingQuestionsHintTimeoutRef.current) {
					clearTimeout(fetchingQuestionsHintTimeoutRef.current);
					fetchingQuestionsHintTimeoutRef.current = null;
				}
				dispatch(setLoading({ loading: true, loadingStep: LoadingMessages.FETCHING_QUESTIONS }));
				fetchingQuestionsHintTimeoutRef.current = setTimeout(() => {
					fetchingQuestionsHintTimeoutRef.current = null;
					dispatch(setLoading({ loading: true, loadingStep: LoadingMessages.FETCHING_QUESTIONS_HINT }));
				}, 8 * TIME_PERIODS_MS.SECOND);
				const answerCountToSend = currentSettings?.answerCount ?? VALIDATION_COUNT.ANSWER_COUNT.DEFAULT;
				const response = await triviaMutation.mutateAsync({
					topic: currentTopic || DEFAULT_GAME_CONFIG.defaultTopic,
					difficulty: currentDifficulty || DEFAULT_GAME_CONFIG.defaultDifficulty,
					questionsPerRequest: questionsPerRequestForAPI,
					answerCount: answerCountToSend,
					...(sessionGameId ? { gameId: sessionGameId } : {}),
					outputLanguage: locale,
					signal: abortController.signal,
				});

				if (ignore) return;

				const responseQuestionCount =
					isRecord(response) && Array.isArray(response?.questions) ? response.questions.length : 0;
				logger.gameInfo('Trivia response received', {
					count: responseQuestionCount,
					resultsCount: responseQuestionCount,
				});

				if (response && isRecord(response) && 'questions' in response) {
					if (Array.isArray(response.questions) && response.questions.length > 0) {
						if (fetchingQuestionsHintTimeoutRef.current) {
							clearTimeout(fetchingQuestionsHintTimeoutRef.current);
							fetchingQuestionsHintTimeoutRef.current = null;
						}
						dispatch(setLoading({ loading: true, loadingStep: LoadingMessages.VALIDATING_QUESTIONS }));
						const validQuestions = response.questions.filter(
							(q): q is TriviaQuestion =>
								isRecord(q) && isNonEmptyString(q.question) && Array.isArray(q.answers) && q.answers.length > 0
						);

						if (validQuestions.length > 0) {
							const limitedQuestions =
								hasQuestionLimit && expectedQuestionCount !== undefined
									? validQuestions.slice(0, expectedQuestionCount)
									: validQuestions;

							const actualQuestionCount = limitedQuestions.length;

							logger.gameInfo('Questions loaded successfully', {
								count: limitedQuestions.length,
								...(gameQuestionCount !== undefined && { questionsPerRequest: gameQuestionCount }),
								actualQuestionCount,
								resultsCount: validQuestions.length,
							});

							if (ignore) return;
							if (currentUser?.id && sessionGameId) {
								trackAnalyticsEvent.mutate({
									eventType: AnalyticsEventType.GAME_START,
									page: AnalyticsPageName.GAME_SESSION,
									action: AnalyticsAction.GAME_STARTED,
									sessionId: sessionGameId,
									properties: {
										topic: currentTopic ?? DEFAULT_GAME_CONFIG.defaultTopic,
										difficulty: currentDifficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty,
										gameMode: currentGameMode ?? GameMode.QUESTION_LIMITED,
										questionCount: limitedQuestions.length,
									},
								});
							}

							if (hasQuestionLimit) {
								if (gameQuestionCount !== actualQuestionCount) {
									dispatch(setGameQuestionCount(actualQuestionCount));
								}
							}
							dispatch(setQuestions({ questions: limitedQuestions }));

							dispatch(ensureGameStartTime());

							initialLoadValuesRef.current = {
								maxQuestionsPerGame,
								answerCount: currentSettings?.answerCount,
								hasQuestionLimit,
							};
							questionsLoadedRef.current = true;
							if (fetchingQuestionsHintTimeoutRef.current) {
								clearTimeout(fetchingQuestionsHintTimeoutRef.current);
								fetchingQuestionsHintTimeoutRef.current = null;
							}
							dispatch(setLoading({ loading: false, loadingStep: LoadingMessages.READY }));
						} else {
							throw new Error(ERROR_MESSAGES.api.NO_VALID_QUESTIONS_IN_RESPONSE);
						}
					} else {
						throw new Error(ERROR_MESSAGES.api.NO_QUESTIONS_RETURNED);
					}
				} else {
					throw new Error(ERROR_MESSAGES.api.INVALID_API_RESPONSE_STRUCTURE);
				}
			} catch (error) {
				if (ignore) return;
				const message = getErrorMessage(error);

				const isAbortError =
					message === 'Request was cancelled' ||
					message.includes('aborted') ||
					message === 'signal is aborted without reason' ||
					(isRecord(error) &&
						'statusCode' in error &&
						error.statusCode === 0 &&
						hasProperty(error, 'details') &&
						isRecord(error.details) &&
						error.details.error === 'Request was cancelled');

				if (isAbortError) {
					if (fetchingQuestionsHintTimeoutRef.current) {
						clearTimeout(fetchingQuestionsHintTimeoutRef.current);
						fetchingQuestionsHintTimeoutRef.current = null;
					}
					logger.gameInfo('Trivia request aborted or timed out', { message });
					isLoadingRef.current = false;
					dispatch(setLoading({ loading: false, loadingStep: LoadingMessages.CONNECTING }));
					const isClientTimeout =
						message.toLowerCase().includes('timeout') || message.toLowerCase().includes('timed out');
					if (isClientTimeout) {
						setDialogError(new Error(ERROR_MESSAGES.api.TRIVIA_GENERATION_SLOW_OR_RATE_LIMIT));
						setShowErrorDialog(true);
					}
					return;
				}

				const isRateLimitOrTimeout =
					message.includes('Too many requests') ||
					message.includes('QUESTION_GENERATION_TIMEOUT') ||
					message.toLowerCase().includes('timed out') ||
					message.toLowerCase().includes('timeout');
				const dialogError: unknown = isRateLimitOrTimeout
					? new Error(ERROR_MESSAGES.api.TRIVIA_GENERATION_SLOW_OR_RATE_LIMIT)
					: error;

				if (fetchingQuestionsHintTimeoutRef.current) {
					clearTimeout(fetchingQuestionsHintTimeoutRef.current);
					fetchingQuestionsHintTimeoutRef.current = null;
				}
				logger.gameError('Failed to load questions', { errorInfo: { message } });
				audioService.play(AudioKey.ERROR);
				setDialogError(dialogError);
				setShowErrorDialog(true);
				dispatch(setLoading({ loading: false, loadingStep: LoadingMessages.CONNECTING }));
				serverSessionGameIdRef.current = null;
				questionsLoadedRef.current = false;
				initialLoadValuesRef.current = null;
				if (errorTimeoutRef.current) {
					clearTimeout(errorTimeoutRef.current);
				}
				errorTimeoutRef.current = setTimeout(() => {
					handleSafeExitFromLoading();
				}, TIME_PERIODS_MS.THREE_SECONDS);
			} finally {
				isLoadingRef.current = false;
				loadInProgressRef.current = false;
			}
		};

		loadQuestions();

		return () => {
			ignore = true;
			isLoadingRef.current = false;
			loadInProgressRef.current = false;
			abortController.abort();
			if (fetchingQuestionsHintTimeoutRef.current) {
				clearTimeout(fetchingQuestionsHintTimeoutRef.current);
				fetchingQuestionsHintTimeoutRef.current = null;
			}
			if (errorTimeoutRef.current) {
				clearTimeout(errorTimeoutRef.current);
				errorTimeoutRef.current = null;
			}
			if (answerTimeoutRef.current) {
				clearTimeout(answerTimeoutRef.current);
				answerTimeoutRef.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		currentUser?.id,
		currentTopic,
		currentDifficulty,
		currentGameMode,
		maxQuestionsPerGame,
		currentSettings?.answerCount,
		questions.length,
		isGameFinalized,
		locale,
	]);

	const handleGameTimeout = useCallback(() => {
		dispatch(finalizeGame());

		const totalTimeSpent = timeLimit;
		const questionsAnswered = currentQuestionIndex + 1;

		logger.gameInfo('Game time expired', {
			score,
			correctAnswers,
			timeSpent: totalTimeSpent,
		});

		dispatch(updateTimeSpent(totalTimeSpent));
		dispatch(setQuestionIndex(questionsAnswered));
		dispatch(setGameQuestionCount(questionsAnswered));

		setShowSummaryLoading(true);
		finalizeGameSession({
			navigateToSummary: true,
			trackAnalytics: false,
			logContext: 'timeout',
			gameId: serverSessionGameIdRef.current,
		});
	}, [score, correctAnswers, currentQuestionIndex, timeLimit, finalizeGameSession, dispatch, serverSessionGameIdRef]);

	const fetchMoreQuestionsAndContinue = useCallback(async () => {
		setIsFetchingMoreQuestions(true);
		const answerCountToSend = currentSettings?.answerCount ?? VALIDATION_COUNT.ANSWER_COUNT.DEFAULT;
		const sessionGameId = serverSessionGameIdRef.current;
		try {
			const response = await triviaMutation.mutateAsync({
				topic: currentTopic || DEFAULT_GAME_CONFIG.defaultTopic,
				difficulty: currentDifficulty || DEFAULT_GAME_CONFIG.defaultDifficulty,
				questionsPerRequest: getSingleSessionQuestionsPerRequest({ gameMode: GameMode.TIME_LIMITED }),
				...(sessionGameId ? { gameId: sessionGameId } : {}),
				answerCount: answerCountToSend,
				outputLanguage: locale,
			});
			if (!response || !isRecord(response) || !('questions' in response) || !Array.isArray(response.questions))
				throw new Error(ERROR_MESSAGES.api.INVALID_API_RESPONSE_STRUCTURE);
			const validQuestions = response.questions.filter(
				(q): q is TriviaQuestion =>
					isRecord(q) && isNonEmptyString(q.question) && Array.isArray(q.answers) && q.answers.length > 0
			);
			if (validQuestions.length > 0) {
				dispatch(appendQuestions({ questions: validQuestions }));
				setIsFetchingMoreQuestions(false);
				dispatch(moveToNextQuestionAction());
				logger.gameInfo('More questions loaded for time-limited game', { count: validQuestions.length });
			} else {
				throw new Error(ERROR_MESSAGES.api.NO_VALID_QUESTIONS_IN_RESPONSE);
			}
		} catch (err) {
			const message = getErrorMessage(err);
			logger.gameError('Failed to load more questions for time-limited game', { errorInfo: { message } });
			setIsFetchingMoreQuestions(false);
			audioService.play(AudioKey.ERROR);
			setDialogError(err);
			setShowErrorDialog(true);
			dispatch(finalizeGame());
			if (serverSessionGameIdRef.current) {
				setShowSummaryLoading(true);
				finalizeGameSession({
					navigateToSummary: true,
					trackAnalytics: false,
					logContext: 'out of questions (fetch more failed)',
					gameId: serverSessionGameIdRef.current,
					playErrorSound: false,
				});
			}
		}
	}, [
		currentTopic,
		currentDifficulty,
		currentSettings?.answerCount,
		dispatch,
		locale,
		triviaMutation,
		finalizeGameSession,
		setDialogError,
	]);

	const recordAnswerHistory = useCallback(
		(isCorrect: boolean, timeSpent: number) => {
			if (!currentQuestion) return;

			const userAnswer: number = selectedAnswer ?? -1;

			const entry = createAnswerHistory(currentQuestion, userAnswer, isCorrect, timeSpent);
			const answers = currentQuestion.answers ?? [];
			const correctText = answers[entry.correctAnswerIndex]?.text;
			const userText = userAnswer >= 0 && userAnswer < answers.length ? answers[userAnswer]?.text : undefined;
			dispatch(
				addAnswerHistory({
					...entry,
					...(correctText !== undefined && { correctAnswerText: correctText }),
					...(userText !== undefined && { userAnswerText: userText }),
				})
			);
		},
		[currentQuestion, selectedAnswer, dispatch]
	);

	const moveToNextQuestion = useCallback(
		(wasCorrect: boolean, scoreEarned: number) => {
			const nextQuestionIndex = currentQuestionIndex + 1;
			const { shouldEndGame, shouldFetchMore } = getSingleSessionCompletionState({
				gameMode: gameModeForUtils,
				currentQuestionIndex,
				gameQuestionCount,
				questionsLength: questions.length,
			});

			logger.gameInfo('Checking game completion', {
				currentQuestionIndex,
				nextQuestionIndex,
				...(gameQuestionCount !== undefined && { gameQuestionCount }),
				isQuestionLimited,
				shouldEndGame,
				sessionId: serverSessionGameIdRef.current ?? undefined,
			});

			if (shouldFetchMore) {
				fetchMoreQuestionsAndContinue();
				return;
			}

			if (shouldEndGame) {
				dispatch(finalizeGame());
				if (!serverSessionGameIdRef.current) return;
				const sessionGameId = serverSessionGameIdRef.current;
				setShowSummaryLoading(true);
				setTimeout(() => {
					finalizeGameSession({
						navigateToSummary: true,
						trackAnalytics: false,
						logContext: 'question limit reached',
						gameId: sessionGameId,
						onSuccess: savedHistory => {
							if (savedHistory) {
								const totalTimeSpent = calculateElapsedSeconds(gameStartTime ?? Date.now());

								logger.gameInfo('Game completed and finalized', {
									score: savedHistory.score,
									correctAnswers: savedHistory.correctAnswers,
									gameQuestionCount: savedHistory.gameQuestionCount,
									timeSpent: totalTimeSpent,
								});

								dispatch(
									updateScore({
										score: savedHistory.score,
										correctAnswers: savedHistory.correctAnswers,
										streak,
										lastScoreEarned: lastScoreEarned ?? 0,
									})
								);
								dispatch(updateTimeSpent(savedHistory.timeSpent ?? totalTimeSpent));
								if (savedHistory.answerHistory) {
									dispatch(setAnswerHistory(savedHistory.answerHistory));
								}
							}
						},
						onError: error => {
							audioService.play(AudioKey.ERROR);
							setDialogError(error);
							setShowErrorDialog(true);
						},
						playErrorSound: true,
					});
				}, TIME_PERIODS_MS.ONE_AND_HALF_SECONDS);
				return;
			} else if (isUnlimited && !isAdmin) {
				const currentTotalCredits = creditBalance?.totalCredits ?? 0;

				if (currentTotalCredits <= 0) {
					dispatch(finalizeGame());
					const totalTimeSpent = calculateElapsedSeconds(gameStartTime ?? Date.now());
					const finalScore = wasCorrect ? score + scoreEarned : score;
					const finalCorrectAnswers = wasCorrect ? correctAnswers + 1 : correctAnswers;

					logger.gameInfo('Game ended - no credits remaining', {
						score: finalScore,
						correctAnswers: finalCorrectAnswers,
						questionsAnswered: nextQuestionIndex,
					});

					dispatch(
						updateScore({
							score: finalScore,
							correctAnswers: finalCorrectAnswers,
							streak: wasCorrect ? streak + 1 : 0,
							lastScoreEarned: wasCorrect ? scoreEarned : 0,
						})
					);
					dispatch(updateTimeSpent(totalTimeSpent));
					dispatch(setQuestionIndex(nextQuestionIndex));

					setExitReason(ExitReason.CREDITS_EXHAUSTED);
					setShowSummaryLoading(true);
					setTimeout(() => {
						finalizeGameSession({
							navigateToSummary: true,
							trackAnalytics: false,
							logContext: 'no credits remaining',
							gameId: serverSessionGameIdRef.current,
						});
					}, TIME_PERIODS_MS.ONE_AND_HALF_SECONDS);
					return;
				}

				if (currentTotalCredits === 1) {
					setShowCreditsWarning(true);
				}

				deductCredits.mutate(
					{
						questionsPerRequest: 1,
						gameMode: GameMode.UNLIMITED,
					},
					{
						onSuccess: () => {
							dispatch(moveToNextQuestionAction());
						},
						onError: error => {
							const message = getErrorMessage(error);
							logger.gameError('Failed to deduct credits for next question', { errorInfo: { message } });
							dispatch(finalizeGame());
							const totalTimeSpent = calculateElapsedSeconds(gameStartTime ?? Date.now());
							const finalScore = wasCorrect ? score + scoreEarned : score;
							const finalCorrectAnswers = wasCorrect ? correctAnswers + 1 : correctAnswers;

							dispatch(
								updateScore({
									score: finalScore,
									correctAnswers: finalCorrectAnswers,
									streak: wasCorrect ? streak + 1 : 0,
									lastScoreEarned: wasCorrect ? scoreEarned : 0,
								})
							);
							dispatch(updateTimeSpent(totalTimeSpent));
							dispatch(setQuestionIndex(nextQuestionIndex));

							setExitReason(ExitReason.CREDITS_EXHAUSTED);
							setShowSummaryLoading(true);
							setTimeout(() => {
								finalizeGameSession({
									navigateToSummary: true,
									trackAnalytics: false,
									logContext: 'credit deduction failed',
									gameId: serverSessionGameIdRef.current,
								});
							}, TIME_PERIODS_MS.ONE_AND_HALF_SECONDS);
						},
					}
				);
			} else {
				dispatch(moveToNextQuestionAction());
			}
		},
		[
			gameModeForUtils,
			isQuestionLimited,
			isUnlimited,
			isAdmin,
			currentQuestionIndex,
			gameQuestionCount,
			questions.length,
			gameStartTime,
			score,
			correctAnswers,
			creditBalance,
			deductCredits,
			finalizeGameSession,
			fetchMoreQuestionsAndContinue,
			dispatch,
			streak,
			lastScoreEarned,
			setDialogError,
		]
	);

	const handleAnswerSelect = useCallback(
		(answerIndex: number) => {
			if (answered) return;
			audioService.play(AudioKey.BUTTON_CLICK);
			dispatch(selectAnswer(answerIndex));
		},
		[answered, dispatch]
	);

	const handleSubmit = useCallback(() => {
		if (answered || selectedAnswer === null || !currentQuestion) return;

		const submittingQuestionId = currentQuestion.id;
		const submittingAnswer = selectedAnswer;
		const submittingQuestionIndex = currentQuestionIndex;

		dispatch(setAnswered(true));
		const timeSpent = Math.max(
			1,
			Math.floor(
				(Date.now() - (gameStartTime ?? Date.now()) - submittingQuestionIndex * TIME_PERIODS_MS.THIRTY_SECONDS) /
					TIME_PERIODS_MS.SECOND
			)
		);

		if (!serverSessionGameIdRef.current) {
			logger.gameError('Cannot submit answer: server session was not initialized', {
				gameId: gameId ?? undefined,
				message: 'Server session gameId is not set. The game session may not have been started on the server.',
			});
			dispatch(setAnswered(false));
			return;
		}
		const sessionGameId = serverSessionGameIdRef.current;
		logger.gameInfo('Submitting answer with server session gameId', {
			serverSessionGameId: sessionGameId,
			reduxGameId: gameId ?? undefined,
			questionId: submittingQuestionId,
		});
		if (gameId && sessionGameId !== gameId) {
			logger.gameInfo('GameId mismatch when submitting - using server session gameId', {
				serverSessionGameId: sessionGameId,
				reduxGameId: gameId,
			});
		}

		submitAnswerToSessionMutation.mutate(
			{
				gameId: sessionGameId,
				questionId: submittingQuestionId,
				answer: submittingAnswer,
				timeSpent,
			},
			{
				onSuccess: result => {
					if (currentQuestionIndex !== submittingQuestionIndex) {
						logger.gameInfo('Answer submission succeeded but question already changed', {
							currentQuestionIndex,
							questionId: submittingQuestionId,
						});
						return;
					}

					const isCorrect = result.isCorrect;
					const scoreEarned = result.scoreEarned;
					const sessionScore = result.sessionScore;

					const newStreak = isCorrect ? streak + 1 : 0;
					const newCorrectAnswers = isCorrect ? correctAnswers + 1 : correctAnswers;

					dispatch(
						updateScore({
							score: sessionScore,
							correctAnswers: newCorrectAnswers,
							streak: newStreak,
							lastScoreEarned: scoreEarned,
						})
					);

					audioService.play(isCorrect ? AudioKey.CORRECT_ANSWER : AudioKey.WRONG_ANSWER);

					logger.gameInfo(isCorrect ? 'Correct answer' : 'Incorrect answer', {
						questionId: submittingQuestionId,
						scoreEarned,
						sessionScore,
						isCorrect,
					});

					recordAnswerHistory(isCorrect, timeSpent);

					if (answerTimeoutRef.current) {
						clearTimeout(answerTimeoutRef.current);
					}
					answerTimeoutRef.current = setTimeout(() => {
						moveToNextQuestion(isCorrect, scoreEarned);
						dispatch(
							updateScore({
								score: sessionScore,
								correctAnswers: newCorrectAnswers,
								streak: newStreak,
								lastScoreEarned: 0,
							})
						);
						answerTimeoutRef.current = null;
					}, TIME_PERIODS_MS.ONE_AND_HALF_SECONDS);
				},
				onError: error => {
					if (currentQuestionIndex !== submittingQuestionIndex) {
						logger.gameInfo('Answer submission failed but question already changed', {
							currentQuestionIndex,
							questionId: submittingQuestionId,
							errorInfo: { message: getErrorMessage(error) },
						});
						dispatch(setAnswered(false));
						return;
					}

					const message = getErrorMessage(error);
					logger.gameError('Failed to submit answer to session', {
						errorInfo: { message },
						questionId: submittingQuestionId,
					});
					audioService.play(AudioKey.ERROR);
					setDialogError(error);
					setShowErrorDialog(true);
					dispatch(setAnswered(false));
				},
			}
		);
	}, [
		answered,
		selectedAnswer,
		currentQuestion,
		currentQuestionIndex,
		gameId,
		gameStartTime,
		streak,
		correctAnswers,
		recordAnswerHistory,
		moveToNextQuestion,
		submitAnswerToSessionMutation,
		dispatch,
		setDialogError,
	]);

	const handleExitGame = useCallback(() => {
		dispatch(finalizeGame());
		logger.gameInfo('User exited game', {
			currentQuestionIndex: currentQuestionIndex + 1,
			score,
			correctAnswers,
		});

		if (serverSessionGameIdRef.current && questions.length > 0 && !loading) {
			finalizeGameSession({
				navigateToSummary: false,
				trackAnalytics: false,
				logContext: 'user exit',
				gameId: serverSessionGameIdRef.current,
			});
		}
		handleClose();
	}, [
		currentQuestionIndex,
		score,
		correctAnswers,
		handleClose,
		questions.length,
		loading,
		finalizeGameSession,
		dispatch,
		serverSessionGameIdRef,
	]);

	const handleFinishUnlimitedGame = useCallback(() => {
		dispatch(finalizeGame());

		const totalTimeSpent = calculateElapsedSeconds(gameStartTime ?? Date.now());
		const questionsAnswered = currentQuestionIndex + 1;

		logger.gameInfo('User finished UNLIMITED game', {
			score,
			correctAnswers,
			questionsPerRequest: questionsAnswered,
		});

		dispatch(updateTimeSpent(totalTimeSpent));
		dispatch(setQuestionIndex(questionsAnswered));
		dispatch(setGameQuestionCount(questionsAnswered));

		setShowSummaryLoading(true);
		finalizeGameSession({
			navigateToSummary: true,
			trackAnalytics: false,
			logContext: 'user finished',
			gameId: serverSessionGameIdRef.current,
		});
	}, [
		score,
		correctAnswers,
		currentQuestionIndex,
		gameStartTime,
		finalizeGameSession,
		dispatch,
		serverSessionGameIdRef,
	]);

	const onBeforeNavigateReset = useCallback(() => {
		dispatch(resetGameSession());
	}, [dispatch]);

	const navigateToPayment = useCallback(() => {
		navigate(ROUTES.PAYMENT);
	}, [navigate]);

	return {
		loading,
		loadingStep,
		isFetchingMoreQuestions,
		showSummaryLoading,
		exitReason,
		isFinalizing,
		questions,
		currentQuestion,
		onBeforeNavigateReset,
		handleClose,
		navigateToPayment,
		showErrorDialog,
		setShowErrorDialog,
		sessionError,
		showCreditsWarning,
		setShowCreditsWarning,
		handleExitGame,
		handleSafeExitFromLoading,
		isTimeLimited,
		timeLimit,
		gameStartTime,
		handleGameTimeout,
		isUnlimited,
		currentQuestionIndex,
		isAdmin,
		creditBalanceTotal: creditBalance?.totalCredits ?? 0,
		hasQuestionLimit,
		gameQuestionCount: gameQuestionCount ?? 0,
		progress,
		currentTopic,
		currentDifficulty,
		streak,
		answered,
		selectedAnswer,
		handleAnswerSelect,
		handleSubmit,
		handleFinishUnlimitedGame,
		score,
	};
}
