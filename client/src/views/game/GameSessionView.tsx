import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import {
	AnalyticsAction,
	AnalyticsEventType,
	AnalyticsPageName,
	ERROR_MESSAGES,
	GAME_MODES_CONFIG,
	GameMode,
	TIME_DURATIONS_SECONDS,
	TIME_PERIODS_MS,
	TimerMode,
	UserRole,
	VALIDATION_COUNT,
	VALIDATORS,
} from '@shared/constants';
import type { TriviaQuestion } from '@shared/types';
import {
	calculateElapsedSeconds,
	calculateRequiredCredits,
	createAnswerHistory,
	getErrorMessage,
	hasProperty,
	isRecord,
	shouldChargeAfterGame,
} from '@shared/utils';
import { getDifficultyDisplayText } from '@shared/validation';

import {
	AudioKey,
	ButtonSize,
	ButtonVariant,
	GAME_STATE_DEFAULTS,
	GameLoadingStep,
	ROUTES,
	SpinnerSize,
} from '@/constants';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AnswerButton,
	Button,
	Card,
	GameStats,
	GameTimer,
	HomeButton,
	Progress,
	Spinner,
} from '@/components';
import {
	useAppDispatch,
	useAppSelector,
	useCreditBalance,
	useCurrentUserData,
	useDeductCredits,
	useGameFinalization,
	useStartGameSession,
	useSubmitAnswerToSession,
	useTrackAnalyticsEvent,
	useTriviaQuestionMutation,
	useUserRole,
} from '@/hooks';
import { useNavigationClose } from '@/hooks/ui/useNavigationClose';
import { audioService, clientLogger as logger } from '@/services';
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
	selectSelectedAnswer,
	selectStreak,
} from '@/redux/selectors';
import {
	addAnswerHistory,
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
	updateScore,
	updateTimeSpent,
} from '@/redux/slices';

export function GameSessionView() {
	const { handleClose } = useNavigationClose({ defaultRoute: ROUTES.HOME });
	const currentUser = useCurrentUserData();
	const dispatch = useAppDispatch();
	const currentTopic = useAppSelector(selectCurrentTopic);
	const currentDifficulty = useAppSelector(selectCurrentDifficulty);
	const currentGameMode = useAppSelector(selectCurrentGameMode);
	const currentSettings = useAppSelector(selectCurrentSettings);
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	// Game mode configuration
	const isQuestionLimited = currentGameMode === GameMode.QUESTION_LIMITED;
	const isTimeLimited = currentGameMode === GameMode.TIME_LIMITED;
	const isUnlimited = currentGameMode === GameMode.UNLIMITED;
	const isMultiplayer = currentGameMode === GameMode.MULTIPLAYER;
	// Question-limited modes (both QUESTION_LIMITED and MULTIPLAYER have question limits)
	const hasQuestionLimit = isQuestionLimited || isMultiplayer;

	// Dynamic limits based on game mode
	const maxQuestionsPerGame =
		currentSettings?.maxQuestionsPerGame ?? GAME_MODES_CONFIG[currentGameMode]?.defaults.maxQuestionsPerGame;

	// Use GameMode default for timeLimit if available, otherwise fallback to 1 minute
	const timeLimit =
		currentSettings?.timeLimit ??
		(currentGameMode ? GAME_MODES_CONFIG[currentGameMode]?.defaults.timeLimit : undefined) ??
		TIME_DURATIONS_SECONDS.MINUTE;

	// Credit deduction
	const deductCredits = useDeductCredits();

	// Game state from Redux
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

	// Initialize gameStartTime if gameId exists but gameStartTime is null
	// Keep this side-effect minimal: do NOT reset the session state just to set time.
	useEffect(() => {
		if (gameId && gameStartTime === null) {
			dispatch(ensureGameStartTime());
		}
	}, [gameId, gameStartTime, dispatch]);

	// Modal state
	const [showExitDialog, setShowExitDialog] = useState(false);
	const [showErrorDialog, setShowErrorDialog] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [showCreditsWarning, setShowCreditsWarning] = useState(false);

	// Prevent infinite loop: track if questions are already loaded or loading
	const questionsLoadedRef = useRef(false);
	const isLoadingRef = useRef(false);
	// Track previous settings to detect actual changes (not just gameId creation)
	const prevSettingsRef = useRef<{ topic: string; difficulty: string; mode: GameMode }>({
		topic: '',
		difficulty: '',
		mode: GameMode.QUESTION_LIMITED,
	});
	// Track timeout IDs for cleanup
	const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const answerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	// Store initial values when loading starts to prevent reloads during active game
	const initialLoadValuesRef = useRef<{
		maxQuestionsPerGame: number | undefined;
		answerCount: number | undefined;
		hasQuestionLimit: boolean;
	} | null>(null);

	// Track finalization state with ref to avoid stale closure issues in cleanup
	const isGameFinalizedRef = useRef(false);
	// Store the gameId that was used to create the server session to prevent mismatch
	const serverSessionGameIdRef = useRef<string | null>(null);
	// Ignore result when effect cleanup ran (e.g. React Strict Mode re-run); avoids aborting so request reaches server
	const loadIgnoreRef = useRef(false);

	// Credit balance tracking
	const { data: creditBalance } = useCreditBalance();

	const triviaMutation = useTriviaQuestionMutation();
	const startGameSessionMutation = useStartGameSession();
	const submitAnswerToSessionMutation = useSubmitAnswerToSession();
	const { finalizeGameSession } = useGameFinalization();
	const trackAnalyticsEvent = useTrackAnalyticsEvent();

	// Sync refs with Redux state
	useEffect(() => {
		isGameFinalizedRef.current = isGameFinalized;
		// Only clear serverSessionGameIdRef if gameId is explicitly reset to null
		// This prevents clearing the server session ID when gameId changes due to race conditions
		// The serverSessionGameIdRef should persist as long as the session exists on the server
		if (!gameId && serverSessionGameIdRef.current) {
			logger.gameInfo('GameId reset to null, clearing server session gameId', {
				serverSessionGameId: serverSessionGameIdRef.current,
			});
			serverSessionGameIdRef.current = null;
			// Music is handled automatically by useRouteBasedMusic hook
		}
		// If game is finalized, clear the server session ID and reset load flags to allow new game
		if (isGameFinalized && serverSessionGameIdRef.current) {
			logger.gameInfo('Game finalized, clearing server session gameId', {
				serverSessionGameId: serverSessionGameIdRef.current,
			});
			serverSessionGameIdRef.current = null;
			// Clear load flags to allow loading questions for a new game
			questionsLoadedRef.current = false;
			initialLoadValuesRef.current = null;
			// Music is handled automatically by useRouteBasedMusic hook
		}
	}, [isGameFinalized, gameId]);

	const progress = hasQuestionLimit && gameQuestionCount ? ((currentQuestionIndex + 1) / gameQuestionCount) * 100 : 0;

	// Check if this game mode should charge after the game ends
	const isChargeAfterGame = shouldChargeAfterGame(currentGameMode);

	// Deduct credits when game starts (not for admins, not for charge-after-game modes)
	// For UNLIMITED mode, deduct 1 credit for the first question
	// Check isPending to prevent duplicate calls during React Strict Mode double-invocation
	useEffect(() => {
		// Skip credit deduction for admins, charge-after-game modes, or if already deducted
		if (isAdmin || isChargeAfterGame || creditsDeducted || questions.length === 0 || deductCredits.isPending) {
			// For charge-after-game modes, mark as "deducted" to skip this effect
			if (isChargeAfterGame && !creditsDeducted && questions.length > 0) {
				dispatch(setCreditsDeducted(true));
			}
			return;
		}

		// Calculate credits based on game mode:
		// - TIME_LIMITED: 5 credits per 30 seconds (use totalGameTime in seconds)
		// - UNLIMITED: 1 credit for the first question
		// - Others: 1 credit per question (total for all questions)
		const gameMode = currentGameMode ?? GameMode.QUESTION_LIMITED;

		// For TIME_LIMITED, send time in seconds (server expects time for credit calculation)
		// For UNLIMITED, send 1 (first question only)
		// For others, send question count
		const valueForDeduction = isTimeLimited
			? timeLimit // Time in seconds for TIME_LIMITED mode
			: isUnlimited
				? 1 // 1 credit for first question in UNLIMITED mode
				: (maxQuestionsPerGame ?? VALIDATION_COUNT.QUESTIONS.MAX); // Question count

		const requiredCredits = calculateRequiredCredits(valueForDeduction, gameMode);

		logger.gameInfo('Deducting credits for game', {
			questionsPerRequest: valueForDeduction,
			gameMode,
		});

		// Mark as deducted immediately to prevent duplicate calls
		dispatch(setCreditsDeducted(true));
		deductCredits.mutate(
			{
				questionsPerRequest: valueForDeduction,
				gameMode,
			},
			{
				onSuccess: () => {
					logger.gameInfo('Credits deducted successfully', { requiredCredits });
				},
				onError: error => {
					const message = getErrorMessage(error);
					logger.gameError('Failed to deduct credits', { errorInfo: { message } });
					// Show error to user and navigate back
					audioService.play(AudioKey.ERROR);
					setErrorMessage(message);
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
	]);

	// Reset loading flags when key dependencies change (allows reload for new game settings)
	// Note: gameId is NOT in dependencies to prevent infinite loop when new gameId is created
	useEffect(() => {
		// Only reset if settings actually changed (not just gameId creation)
		const settingsChanged =
			prevSettingsRef.current.topic !== currentTopic ||
			prevSettingsRef.current.difficulty !== currentDifficulty ||
			prevSettingsRef.current.mode !== currentGameMode;

		if (settingsChanged) {
			questionsLoadedRef.current = false;
			isLoadingRef.current = false;
			// Clear initial load values when settings change to allow reload
			initialLoadValuesRef.current = null;
			// Reset game session when settings change (only if game was already started)
			if (gameId && questions.length > 0) {
				dispatch(resetGameSession());
				// Clear server session gameId when resetting
				serverSessionGameIdRef.current = null;
			}
			// Update tracked values
			prevSettingsRef.current = { topic: currentTopic, difficulty: currentDifficulty, mode: currentGameMode };
		}
	}, [currentTopic, currentDifficulty, currentGameMode, dispatch, gameId, questions.length]);

	// Load initial questions
	useEffect(() => {
		// Prevent duplicate loads (incl. React Strict Mode effects)
		// If we've already loaded once for this view instance, don't run again.
		if (isLoadingRef.current || questionsLoadedRef.current) {
			return;
		}

		// Don't load questions if game is finalized - wait for navigation away or reset
		// This prevents race conditions where finalized game triggers new question loading
		if (isGameFinalized) {
			return;
		}

		// Don't load questions if game is already loading (e.g., "Connecting to server...")
		// This prevents duplicate question loading when gameId exists but questions haven't loaded yet
		if (loading && gameId && questions.length === 0) {
			return;
		}

		// Prevent loading questions when we already have questions for this game (active or resumed/persisted).
		// Without this, removing answered/currentQuestionIndex from deps could cause reload on mount with persisted state at first question.
		if (questions.length > 0 && gameId && !isGameFinalized) {
			if (initialLoadValuesRef.current === null) {
				initialLoadValuesRef.current = {
					maxQuestionsPerGame,
					answerCount: currentSettings?.answerCount,
					hasQuestionLimit,
				};
			}
			questionsLoadedRef.current = true;
			return;
		}

		// Mark as loading immediately to prevent duplicate invocations
		isLoadingRef.current = true;
		loadIgnoreRef.current = false;

		const abortController = new AbortController();

		const loadQuestions = async () => {
			try {
				if (loadIgnoreRef.current) return;
				dispatch(setLoading({ loading: true, loadingStep: GameLoadingStep.CONNECTING }));
				// Clear any previous error state
				setErrorMessage('');
				setShowErrorDialog(false);

				// Capture gameId at the start to prevent race conditions
				// If gameId is null, create a new one and update Redux state
				let sessionGameId = gameId;
				if (!sessionGameId) {
					sessionGameId = crypto.randomUUID();
					const initialGameQuestionCount =
						hasQuestionLimit && maxQuestionsPerGame !== undefined && maxQuestionsPerGame !== null
							? maxQuestionsPerGame
							: undefined;
					dispatch(startGameSession({ gameId: sessionGameId, gameQuestionCount: initialGameQuestionCount }));
				}

				// Convert undefined to UNLIMITED (-1) for API (questionsPerRequest must be a number)
				// For question-limited modes (QUESTION_LIMITED and MULTIPLAYER), use maxQuestionsPerGame or default (never UNLIMITED)
				// For other modes, use UNLIMITED if maxQuestionsPerGame is undefined
				const questionsPerRequestForAPI = hasQuestionLimit
					? (maxQuestionsPerGame ??
						GAME_MODES_CONFIG[currentGameMode ?? GameMode.QUESTION_LIMITED]?.defaults.maxQuestionsPerGame ??
						VALIDATION_COUNT.QUESTIONS.MAX)
					: (maxQuestionsPerGame ?? VALIDATION_COUNT.QUESTIONS.UNLIMITED);

				// Determine the expected question count for question-limited modes
				const expectedQuestionCount = hasQuestionLimit
					? (gameQuestionCount ??
						maxQuestionsPerGame ??
						GAME_MODES_CONFIG[currentGameMode ?? GameMode.QUESTION_LIMITED]?.defaults.maxQuestionsPerGame)
					: undefined;

				logger.gameInfo('Loading trivia questions', {
					topic: currentTopic || GAME_STATE_DEFAULTS.TOPIC,
					difficulty: currentDifficulty || 'medium',
					questionsPerRequest: questionsPerRequestForAPI,
					...(expectedQuestionCount !== undefined && { expectedQuestionCount }),
				});

				dispatch(setLoading({ loading: true, loadingStep: GameLoadingStep.FETCHING_QUESTIONS }));
				// Always send answerCount - use currentSettings value or default
				const answerCountToSend = currentSettings?.answerCount ?? VALIDATION_COUNT.ANSWER_COUNT.DEFAULT;
				const response = await triviaMutation.mutateAsync({
					topic: currentTopic || GAME_STATE_DEFAULTS.TOPIC,
					difficulty: currentDifficulty || 'medium',
					questionsPerRequest: questionsPerRequestForAPI,
					...(currentUser?.id ? { userId: currentUser.id } : {}),
					answerCount: answerCountToSend,
					signal: abortController.signal,
				});

				if (loadIgnoreRef.current) return;

				// API returns an object with questions array and fromCache flag
				if (response && isRecord(response) && 'questions' in response) {
					// Validate we got an array of questions
					if (Array.isArray(response.questions) && response.questions.length > 0) {
						dispatch(setLoading({ loading: true, loadingStep: GameLoadingStep.VALIDATING_QUESTIONS }));
						// Validate each question has required fields
						const validQuestions = response.questions.filter(
							(q): q is TriviaQuestion =>
								isRecord(q) && VALIDATORS.string(q.question) && Array.isArray(q.answers) && q.answers.length > 0
						);

						if (validQuestions.length > 0) {
							// Limit questions to expectedQuestionCount if in question-limited mode
							// Use gameQuestionCount if set, otherwise use maxQuestionsPerGame or default
							// The server may return more questions than requested, but we only play the requested amount
							const limitedQuestions =
								hasQuestionLimit && expectedQuestionCount !== undefined
									? validQuestions.slice(0, expectedQuestionCount)
									: validQuestions;

							// Update gameQuestionCount to match actual questions loaded (always for question-limited modes)
							// This ensures the displayed count matches the actual questions available
							const actualQuestionCount = limitedQuestions.length;
							if (hasQuestionLimit) {
								// Always update if different from expected or if not set
								if (gameQuestionCount !== actualQuestionCount) {
									dispatch(setGameQuestionCount(actualQuestionCount));
								}
							}

							dispatch(setQuestions({ questions: limitedQuestions }));
							logger.gameInfo('Questions loaded successfully', {
								count: limitedQuestions.length,
								...(gameQuestionCount !== undefined && { questionsPerRequest: gameQuestionCount }),
								actualQuestionCount,
								resultsCount: validQuestions.length,
							});

							// Start game session on server - must complete before allowing answers
							if (loadIgnoreRef.current) return;
							if (currentUser?.id && sessionGameId) {
								dispatch(setLoading({ loading: true, loadingStep: GameLoadingStep.INITIALIZING_SESSION }));
								try {
									await startGameSessionMutation.mutateAsync({
										gameId: sessionGameId,
										topic: currentTopic ?? 'General',
										difficulty: currentDifficulty ?? 'medium',
										gameMode: currentGameMode ?? GameMode.QUESTION_LIMITED,
									});
									// Store the gameId that was used to create the server session
									// This is critical - we MUST use this gameId for all subsequent API calls
									serverSessionGameIdRef.current = sessionGameId;
									logger.gameInfo('Server session gameId stored', {
										serverSessionGameId: sessionGameId,
										reduxGameId: gameId ?? undefined,
									});
									// Track analytics event for game start
									dispatch(setLoading({ loading: true, loadingStep: GameLoadingStep.TRACKING_ANALYTICS }));
									trackAnalyticsEvent.mutate({
										eventType: AnalyticsEventType.GAME_START,
										page: AnalyticsPageName.GAME_SESSION,
										action: AnalyticsAction.GAME_STARTED,
										sessionId: sessionGameId,
										properties: {
											topic: currentTopic ?? 'General',
											difficulty: currentDifficulty ?? 'medium',
											gameMode: currentGameMode ?? GameMode.QUESTION_LIMITED,
											questionCount: limitedQuestions.length,
										},
									});
									if (loadIgnoreRef.current) return;
								} catch (sessionError) {
									if (loadIgnoreRef.current) return;
									const sessionErrorMessage = getErrorMessage(sessionError);
									logger.gameError('Failed to start game session on server', {
										errorInfo: { message: sessionErrorMessage },
										gameId: sessionGameId,
									});
									serverSessionGameIdRef.current = null;
									throw new Error(`Failed to initialize game session: ${sessionErrorMessage}`);
								}
							}

							// Music is handled automatically by useRouteBasedMusic hook
							// Store initial load values to prevent reloads during active game
							initialLoadValuesRef.current = {
								maxQuestionsPerGame,
								answerCount: currentSettings?.answerCount,
								hasQuestionLimit,
							};
							// Mark as loaded only after full initialization succeeds (questions + optional server session)
							questionsLoadedRef.current = true;
							dispatch(setLoading({ loading: false, loadingStep: GameLoadingStep.READY }));
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
				if (loadIgnoreRef.current) return;
				const message = getErrorMessage(error);

				// Check if error is an abort/cancellation error - these are expected and shouldn't be shown to user
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

				// Skip error handling for abort errors - they're expected when React Query cancels previous requests
				if (isAbortError) {
					// Reset loading flag and return early - don't show error to user
					isLoadingRef.current = false;
					return;
				}

				logger.gameError('Failed to load questions', { errorInfo: { message } });
				audioService.play(AudioKey.ERROR);
				setErrorMessage(message);
				setShowErrorDialog(true);
				dispatch(setLoading({ loading: false, loadingStep: GameLoadingStep.CONNECTING }));
				// Clear server session gameId on error to prevent using invalid session
				serverSessionGameIdRef.current = null;
				// Don't mark as loaded on error - allow retry if dependencies change
				questionsLoadedRef.current = false;
				// Clear initial load values on error to allow retry
				initialLoadValuesRef.current = null;
				// Clear previous timeout if exists
				if (errorTimeoutRef.current) {
					clearTimeout(errorTimeoutRef.current);
				}
				// Music is handled automatically by useRouteBasedMusic hook when route changes
				errorTimeoutRef.current = setTimeout(() => {
					handleClose();
				}, TIME_PERIODS_MS.THREE_SECONDS);
			} finally {
				// Reset loading flag
				isLoadingRef.current = false;
			}
		};

		loadQuestions();

		// Cleanup on unmount or effect re-run (e.g. React Strict Mode). Do not abort so the request can reach the server;
		// loadIgnoreRef causes the completion handler to skip state updates when this cleanup ran.
		return () => {
			loadIgnoreRef.current = true;
			// Clear any pending timeouts to prevent state updates after unmount
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
		// Omitted: gameId (would abort in-flight request when we set it), gameQuestionCount (updated inside effect).
		// Omitted: hasQuestionLimit, isTimeLimited (derived from currentGameMode). answered, currentQuestionIndex (would re-run every answer/step; guards use current values). dispatch (stable).
	]);

	const handleGameTimeout = useCallback(() => {
		// Mark as finalized to prevent auto-finalization on unmount
		dispatch(finalizeGame());
		// Music is handled automatically by useRouteBasedMusic hook

		const totalTimeSpent = calculateElapsedSeconds(gameStartTime ?? Date.now());
		const questionsAnswered = currentQuestionIndex + 1;

		logger.gameInfo('Game time expired', {
			score,
			correctAnswers,
			timeSpent: totalTimeSpent,
		});

		// Update Redux state with final data
		dispatch(updateTimeSpent(totalTimeSpent));
		dispatch(setQuestionIndex(questionsAnswered));

		// Finalize game session before navigating - use serverSessionGameIdRef to prevent mismatch
		finalizeGameSession({
			navigateToSummary: true,
			trackAnalytics: false, // Will be tracked in summary view
			logContext: 'timeout',
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

	const recordAnswerHistory = useCallback(
		(isCorrect: boolean, timeSpent: number) => {
			if (!currentQuestion) return;

			// Use selectedAnswer if available, otherwise use -1 to indicate no answer (timeout)
			const userAnswer: number = selectedAnswer ?? -1;

			const answerHistory = createAnswerHistory(currentQuestion, userAnswer, isCorrect, timeSpent);
			dispatch(addAnswerHistory(answerHistory));
		},
		[currentQuestion, selectedAnswer, dispatch]
	);

	const moveToNextQuestion = useCallback(
		(wasCorrect: boolean, scoreEarned: number) => {
			// Check if game is complete based on mode
			const nextQuestionIndex = currentQuestionIndex + 1;
			const shouldEndGame =
				hasQuestionLimit && gameQuestionCount
					? nextQuestionIndex >= gameQuestionCount // Question limit reached (for QUESTION_LIMITED and MULTIPLAYER)
					: false; // In time-limited and unlimited, only time/credits end the game

			logger.gameInfo('Checking game completion', {
				currentQuestionIndex,
				nextQuestionIndex,
				...(gameQuestionCount !== undefined && { gameQuestionCount }),
				isQuestionLimited,
				shouldEndGame,
				sessionId: serverSessionGameIdRef.current ?? undefined,
			});

			if (shouldEndGame) {
				// Game over - finalize session on server and navigate to summary
				// Music is handled automatically by useRouteBasedMusic hook
				// Finalize game session on server (server calculates final score)
				dispatch(finalizeGame());
				if (!serverSessionGameIdRef.current) return;
				finalizeGameSession({
					navigateToSummary: true,
					trackAnalytics: false, // Will be tracked in summary view
					logContext: 'question limit reached',
					gameId: serverSessionGameIdRef.current,
					onSuccess: savedHistory => {
						if (savedHistory) {
							const totalTimeSpent = calculateElapsedSeconds(gameStartTime ?? Date.now());

							logger.gameInfo('Game completed and finalized', {
								score: savedHistory.score,
								correctAnswers: savedHistory.correctAnswers,
								gameQuestionCount: savedHistory.gameQuestionCount,
								timeSpent: totalTimeSpent,
							});

							// Update Redux state with final data before navigation
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
						const message = getErrorMessage(error);
						audioService.play(AudioKey.ERROR);
						setErrorMessage(message);
						setShowErrorDialog(true);
					},
					playErrorSound: true,
				});
				return;
			} else if (isUnlimited && !isAdmin) {
				// For UNLIMITED mode, deduct credit for the next question
				// Check if user has enough credits before proceeding
				const currentTotalCredits = creditBalance?.totalCredits ?? 0;

				if (currentTotalCredits <= 0) {
					// No credits left - end game
					dispatch(finalizeGame());
					// Music is handled automatically by useRouteBasedMusic hook
					const totalTimeSpent = calculateElapsedSeconds(gameStartTime ?? Date.now());
					const finalScore = wasCorrect ? score + scoreEarned : score;
					const finalCorrectAnswers = wasCorrect ? correctAnswers + 1 : correctAnswers;

					logger.gameInfo('Game ended - no credits remaining', {
						score: finalScore,
						correctAnswers: finalCorrectAnswers,
						questionsAnswered: nextQuestionIndex,
					});

					// Update Redux state with final data
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

					// Finalize game session before navigating - use serverSessionGameIdRef to prevent mismatch
					finalizeGameSession({
						navigateToSummary: true,
						trackAnalytics: false, // Will be tracked in summary view
						logContext: 'no credits remaining',
						gameId: serverSessionGameIdRef.current,
					});
					return;
				}

				// Check if this will be the last question (1 credit remaining before deduction)
				if (currentTotalCredits === 1) {
					setShowCreditsWarning(true);
				}

				// Deduct credit for next question
				deductCredits.mutate(
					{
						questionsPerRequest: 1,
						gameMode: GameMode.UNLIMITED,
					},
					{
						onSuccess: updatedBalance => {
							const remainingCredits = updatedBalance.totalCredits;

							// If no credits left after deduction, end game after this question
							if (remainingCredits <= 0) {
								// Continue to next question, but it will be the last one
								dispatch(moveToNextQuestionAction());
							} else {
								// Move to next question
								dispatch(moveToNextQuestionAction());
							}
						},
						onError: error => {
							const message = getErrorMessage(error);
							logger.gameError('Failed to deduct credits for next question', { errorInfo: { message } });
							// If deduction fails due to insufficient credits, end game
							dispatch(finalizeGame());
							// Music is handled automatically by useRouteBasedMusic hook
							const totalTimeSpent = calculateElapsedSeconds(gameStartTime ?? Date.now());
							const finalScore = wasCorrect ? score + scoreEarned : score;
							const finalCorrectAnswers = wasCorrect ? correctAnswers + 1 : correctAnswers;

							// Update Redux state with final data
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

							// Finalize game session before navigating - use serverSessionGameIdRef to prevent mismatch
							finalizeGameSession({
								navigateToSummary: true,
								trackAnalytics: false, // Will be tracked in summary view
								logContext: 'credit deduction failed',
								gameId: serverSessionGameIdRef.current,
							});
						},
					}
				);
			} else {
				// Next question - reset state
				dispatch(moveToNextQuestionAction());
			}
		},
		[
			hasQuestionLimit,
			isUnlimited,
			isAdmin,
			currentQuestionIndex,
			gameQuestionCount,
			gameStartTime,
			score,
			correctAnswers,
			creditBalance,
			deductCredits,
			finalizeGameSession,
			gameId,
			dispatch,
			streak,
			lastScoreEarned,
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

		// Capture questionId and answer before mutation to prevent race conditions
		const submittingQuestionId = currentQuestion.id;
		const submittingAnswer = selectedAnswer;
		const submittingQuestionIndex = currentQuestionIndex;

		dispatch(setAnswered(true));
		// Calculate actual time spent (in seconds)
		const timeSpent = Math.max(
			1,
			Math.floor(
				(Date.now() - (gameStartTime ?? Date.now()) - submittingQuestionIndex * TIME_PERIODS_MS.THIRTY_SECONDS) / 1000
			)
		);

		// Use the gameId that was used to create the server session to prevent mismatch
		// This prevents race conditions where gameId changes after session creation
		// We MUST use serverSessionGameIdRef because it's the gameId that created the session on the server
		// If serverSessionGameIdRef is not set, the session was never created on the server, so we can't submit answers
		if (!serverSessionGameIdRef.current) {
			logger.gameError('Cannot submit answer: server session was not initialized', {
				gameId: gameId ?? undefined,
				overrideGameId: serverSessionGameIdRef.current ?? undefined,
				reduxGameId: gameId ?? undefined,
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
		// Additional safety check: if gameId from Redux doesn't match serverSessionGameIdRef, log warning
		// This indicates a potential race condition, but we still use serverSessionGameIdRef
		if (gameId && serverSessionGameIdRef.current !== gameId) {
			logger.gameError('GameId mismatch detected when submitting answer', {
				serverSessionGameId: serverSessionGameIdRef.current,
				message: `Server session gameId ${serverSessionGameIdRef.current} does not match Redux gameId ${gameId}, using server session gameId`,
			});
		}

		// Submit answer to server session - server calculates score
		// sessionGameId is guaranteed to be string after the check above
		submitAnswerToSessionMutation.mutate(
			{
				gameId: sessionGameId,
				questionId: submittingQuestionId,
				answer: submittingAnswer,
				timeSpent,
			},
			{
				onSuccess: result => {
					// Verify we're still on the same question before processing success
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

					// Update Redux state with server-calculated values
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

					if (isCorrect) {
						audioService.play(AudioKey.CORRECT_ANSWER);
					} else {
						audioService.play(AudioKey.WRONG_ANSWER);
					}

					logger.gameInfo(isCorrect ? 'Correct answer' : 'Incorrect answer', {
						questionId: submittingQuestionId,
						scoreEarned,
						sessionScore,
						isCorrect,
					});

					recordAnswerHistory(isCorrect, timeSpent);

					// Clear previous timeout if exists (e.g., if user submitted another answer quickly)
					if (answerTimeoutRef.current) {
						clearTimeout(answerTimeoutRef.current);
					}
					answerTimeoutRef.current = setTimeout(() => {
						moveToNextQuestion(isCorrect, scoreEarned);
						// Clear last score earned after moving to next question
						dispatch(
							updateScore({
								score: sessionScore,
								correctAnswers: newCorrectAnswers,
								streak: newStreak,
								lastScoreEarned: 0,
							})
						);
						answerTimeoutRef.current = null;
					}, 1500);
				},
				onError: error => {
					// Verify we're still on the same question before showing error
					if (currentQuestionIndex !== submittingQuestionIndex) {
						logger.gameInfo('Answer submission failed but question already changed', {
							currentQuestionIndex,
							questionId: submittingQuestionId,
							errorInfo: { message: getErrorMessage(error) },
						});
						// Don't show error dialog if question already changed
						dispatch(setAnswered(false));
						return;
					}

					const message = getErrorMessage(error);
					logger.gameError('Failed to submit answer to session', {
						errorInfo: { message },
						questionId: submittingQuestionId,
					});
					audioService.play(AudioKey.ERROR);
					setErrorMessage(message);
					setShowErrorDialog(true);
					// Reset answered state to allow retry
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
	]);

	const handleExitGame = useCallback(() => {
		// Mark as finalized to prevent auto-finalization
		dispatch(finalizeGame());
		logger.gameInfo('User exited game', {
			currentQuestionIndex: currentQuestionIndex + 1,
			score,
			correctAnswers,
		});

		// Finalize game session if game has started (has questions and not loading)
		// Use serverSessionGameIdRef to ensure we finalize the correct session
		if (serverSessionGameIdRef.current && questions.length > 0 && !loading) {
			finalizeGameSession({
				navigateToSummary: false, // User is exiting, don't navigate
				trackAnalytics: false, // Don't track analytics on exit
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

	// Handle finishing the game in UNLIMITED mode (user chooses to end)
	const handleFinishUnlimitedGame = useCallback(() => {
		dispatch(finalizeGame());
		// Music is handled automatically by useRouteBasedMusic hook

		const totalTimeSpent = calculateElapsedSeconds(gameStartTime ?? Date.now());
		const questionsAnswered = currentQuestionIndex + 1;

		logger.gameInfo('User finished UNLIMITED game', {
			score,
			correctAnswers,
			questionsPerRequest: questionsAnswered,
		});

		// Update Redux state with final data
		dispatch(updateTimeSpent(totalTimeSpent));
		dispatch(setQuestionIndex(questionsAnswered));

		// Finalize game session before navigating - use serverSessionGameIdRef to prevent mismatch
		finalizeGameSession({
			navigateToSummary: true,
			trackAnalytics: false, // Will be tracked in summary view
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

	// Loading state
	if (loading) {
		return (
			<main className='h-screen overflow-hidden flex items-center justify-center animate-fade-in-only'>
				<div className='text-center'>
					<Spinner size={SpinnerSize.FULL} className='mx-auto mb-4' />
					<motion.p
						key={loadingStep}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className='text-lg md:text-xl text-foreground'
					>
						{loadingStep}
					</motion.p>
				</div>
			</main>
		);
	}

	// No questions or invalid current question state
	if (!questions || questions.length === 0 || !currentQuestion) {
		return (
			<main className='h-screen overflow-hidden flex items-center justify-center animate-fade-in-only'>
				<div className='text-center'>
					<p className='text-lg md:text-xl text-foreground mb-4'>
						{!questions || questions.length === 0 ? 'No questions available' : 'Loading question...'}
					</p>
					<HomeButton />
				</div>
			</main>
		);
	}

	return (
		<main className='h-screen overflow-hidden animate-fade-in-up-simple'>
			<div className='container mx-auto px-4 pt-0 pb-4 max-w-4xl h-full flex flex-col'>
				{/* Header Section - Compact */}
				<div className='flex-shrink-0 mb-4'>
					{/* Game Timer with Stats - persists across all questions */}
					<div className='flex items-center justify-between gap-4 mb-3'>
						<GameTimer
							key='game-timer'
							mode={isTimeLimited ? TimerMode.COUNTDOWN : TimerMode.ELAPSED}
							initialTime={isTimeLimited ? timeLimit : undefined}
							startTime={gameStartTime ?? undefined}
							onTimeout={isTimeLimited ? handleGameTimeout : undefined}
							label={isTimeLimited ? 'Game Time' : 'Time Elapsed'}
							showProgressBar={isTimeLimited}
							className='flex-1'
						/>
						{/* Game Stats - Only for UNLIMITED mode */}
						{isUnlimited && <GameStats currentQuestionIndex={currentQuestionIndex} />}
					</div>

					{/* Progress Bar - Only for question-limited modes */}
					{hasQuestionLimit && (
						<div className='mt-3 mb-3'>
							<div className='flex justify-between items-center mb-1.5'>
								<span className='text-sm text-foreground font-medium'>
									Question {currentQuestionIndex + 1} of {gameQuestionCount}
								</span>
								<span className='text-primary font-bold text-sm'>Score: {score}</span>
							</div>
							<Progress value={progress} className='h-2' />
						</div>
					)}

					{/* Game Info - Compact */}
					<div className='mb-3 text-center'>
						<div className='flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap'>
							<span>Topic: {currentTopic ?? GAME_STATE_DEFAULTS.TOPIC}</span>
							<span className='text-muted-foreground/50'>•</span>
							<span>Difficulty: {getDifficultyDisplayText(currentDifficulty ?? GAME_STATE_DEFAULTS.DIFFICULTY)}</span>
							{streak > 1 && (
								<>
									<span className='text-muted-foreground/50'>•</span>
									<span className='text-primary font-medium'>Streak: {streak}</span>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Main Content - Scrollable if needed */}
				<div className='flex-1 flex flex-col min-h-0'>
					{/* Question Card - Compact */}
					<Card className='p-4 mb-4 flex-shrink-0'>
						<p className='text-xl text-foreground font-medium text-center leading-tight'>{currentQuestion?.question}</p>
					</Card>

					{/* Answers - Always 2 rows, 2-3 columns based on answer count */}
					<AnswerButton
						answers={currentQuestion?.answers}
						answered={answered}
						selectedAnswer={selectedAnswer}
						currentQuestion={currentQuestion}
						onAnswerClick={handleAnswerSelect}
						showResult={answered}
						className='mb-4'
						emptyStateMessage='No answers available'
					/>

					{/* Submit Button - Compact */}
					<Button
						onClick={handleSubmit}
						disabled={selectedAnswer === null || answered}
						size={ButtonSize.LG}
						className='w-full py-4 text-base mb-3 flex-shrink-0'
					>
						{answered ? 'Processing...' : 'Submit Answer'}
					</Button>

					{/* Exit/Finish Buttons - Compact */}
					<div className='text-center flex-shrink-0 flex justify-center gap-4'>
						{isUnlimited && currentQuestionIndex > 0 && (
							<Button
								onClick={handleFinishUnlimitedGame}
								variant={ButtonVariant.DEFAULT}
								size={ButtonSize.SM}
								className='text-xs'
							>
								Finish Game
							</Button>
						)}
						<Button
							onClick={() => setShowExitDialog(true)}
							size={ButtonSize.SM}
							variant={ButtonVariant.GHOST}
							className='text-xs'
						>
							Exit Game
						</Button>
					</div>
				</div>
			</div>

			{/* Exit Confirmation Dialog */}
			<AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Exit Game</AlertDialogTitle>
						<AlertDialogDescription>Are you sure you want to quit? Your progress will be lost.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Continue Playing</AlertDialogCancel>
						<AlertDialogAction onClick={handleExitGame}>Exit Game</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Error Dialog */}
			<AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Error</AlertDialogTitle>
						<AlertDialogDescription>{errorMessage}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						{/* Music is handled automatically by useRouteBasedMusic hook when route changes */}
						<AlertDialogAction onClick={handleClose}>OK</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Credits Warning Dialog */}
			<AlertDialog open={showCreditsWarning} onOpenChange={setShowCreditsWarning}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Last Question Warning</AlertDialogTitle>
						<AlertDialogDescription>You have one credit left. This will be your last question.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction onClick={() => setShowCreditsWarning(false)}>Continue</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</main>
	);
}
