import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import {
	AnalyticsAction,
	AnalyticsEventType,
	AnalyticsPageName,
	ERROR_MESSAGES,
	GAME_MODES_CONFIG,
	GameMode,
	TIME_PERIODS_MS,
	UserRole,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { TriviaQuestion } from '@shared/types';
import {
	calculateElapsedSeconds,
	calculateRequiredCredits,
	createQuestionData,
	getCorrectAnswerIndex,
	getErrorMessage,
	isRecord,
	shouldChargeAfterGame,
} from '@shared/utils';
import { getDifficultyDisplayText } from '@shared/validation';

import { AudioKey, ButtonSize, ButtonVariant, GAME_STATE_DEFAULTS, GameLoadingStep, SpinnerSize } from '@/constants';
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
	BackToHomeButton,
	Button,
	Card,
	GameStats,
	GameTimer,
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
	useGameSessionNavigation,
	useStartGameSession,
	useSubmitAnswerToSession,
	useTrackAnalyticsEvent,
	useTriviaQuestionMutation,
	useUserRole,
} from '@/hooks';
import { audioService, clientLogger as logger } from '@/services';
import { getAnswerLetter } from '@/utils';
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
	addQuestionData,
	finalizeGame,
	moveToNextQuestion as moveToNextQuestionAction,
	resetGameSession,
	selectAnswer,
	setAnswered,
	setCreditsDeducted,
	setLoading,
	setQuestionIndex,
	setQuestions,
	setQuestionsData,
	startGameSession,
	updateScore,
	updateTimeSpent,
} from '@/redux/slices';

export function GameSessionView() {
	const { handleClose, resumeBackgroundMusic, startGameMusic, endGameMusic } = useGameSessionNavigation();
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

	// Dynamic limits based on game mode
	const maxQuestionsPerGame =
		currentSettings?.maxQuestionsPerGame ?? GAME_MODES_CONFIG[currentGameMode]?.defaults.maxQuestionsPerGame;

	const timeLimit = currentSettings?.timeLimit ?? 60;

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

	// Initialize game session on mount if not already initialized
	useEffect(() => {
		if (!gameId) {
			const newGameId = crypto.randomUUID();
			const initialGameQuestionCount =
				isQuestionLimited && maxQuestionsPerGame !== undefined && maxQuestionsPerGame !== null
					? maxQuestionsPerGame
					: undefined;
			dispatch(startGameSession({ gameId: newGameId, gameQuestionCount: initialGameQuestionCount }));
		} else if (gameStartTime === null) {
			// If gameId exists but gameStartTime is null, update it
			dispatch(startGameSession({ gameId, gameQuestionCount }));
		}
	}, [gameId, gameStartTime, gameQuestionCount, dispatch, isQuestionLimited, maxQuestionsPerGame]);

	// Modal state
	const [showExitDialog, setShowExitDialog] = useState(false);
	const [showErrorDialog, setShowErrorDialog] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [showCreditsWarning, setShowCreditsWarning] = useState(false);

	// Prevent infinite loop: track if questions are already loaded or loading
	const questionsLoadedRef = useRef(false);
	const isLoadingRef = useRef(false);

	// Track finalization state with ref to avoid stale closure issues in cleanup
	const isGameFinalizedRef = useRef(false);
	const gameStateRef = useRef({
		gameId: '',
		questionsLength: 0,
		loading: true,
		score: 0,
		correctAnswers: 0,
		currentQuestionIndex: 0,
	});

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
		gameStateRef.current = {
			gameId: gameId ?? '',
			questionsLength: questions.length,
			loading,
			score,
			correctAnswers,
			currentQuestionIndex,
		};
	}, [isGameFinalized, gameId, questions.length, loading, score, correctAnswers, currentQuestionIndex]);

	// currentQuestion is now from Redux selector

	const progress = isQuestionLimited && gameQuestionCount ? ((currentQuestionIndex + 1) / gameQuestionCount) * 100 : 0;

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
	useEffect(() => {
		questionsLoadedRef.current = false;
		isLoadingRef.current = false;
		// Reset game session when settings change (only if game was already started)
		if (gameId && questions.length > 0) {
			dispatch(resetGameSession());
		}
	}, [currentTopic, currentDifficulty, currentGameMode, dispatch, gameId, questions.length]);

	// Load initial questions
	useEffect(() => {
		// Prevent infinite loop: skip if already loading or if questions are already loaded
		if (isLoadingRef.current || (questionsLoadedRef.current && questions.length > 0)) {
			return;
		}

		const loadQuestions = async () => {
			// Mark as loading immediately to prevent React Strict Mode double-invocation
			if (isLoadingRef.current) {
				return;
			}
			isLoadingRef.current = true;

			try {
				dispatch(setLoading({ loading: true, loadingStep: GameLoadingStep.CONNECTING }));
				// Clear any previous error state
				setErrorMessage('');
				setShowErrorDialog(false);

				// Convert undefined to UNLIMITED (-1) for API (questionsPerRequest must be a number)
				const questionsPerRequestForAPI = maxQuestionsPerGame ?? VALIDATION_COUNT.QUESTIONS.UNLIMITED;
				logger.gameInfo('Loading trivia questions', {
					topic: currentTopic || GAME_STATE_DEFAULTS.TOPIC,
					difficulty: currentDifficulty || 'medium',
					questionsPerRequest: questionsPerRequestForAPI,
				});

				dispatch(setLoading({ loading: true, loadingStep: GameLoadingStep.FETCHING_QUESTIONS }));
				const response = await triviaMutation.mutateAsync({
					topic: currentTopic || GAME_STATE_DEFAULTS.TOPIC,
					difficulty: currentDifficulty || 'medium',
					questionsPerRequest: questionsPerRequestForAPI,
					...(currentUser?.id ? { userId: currentUser.id } : {}),
					...(currentSettings?.answerCount !== undefined ? { answerCount: currentSettings.answerCount } : {}),
				});

				// API returns an object with questions array and fromCache flag
				if (response && isRecord(response) && 'questions' in response) {
					// Validate we got an array of questions
					if (Array.isArray(response.questions) && response.questions.length > 0) {
						dispatch(setLoading({ loading: true, loadingStep: GameLoadingStep.VALIDATING_QUESTIONS }));
						// Validate each question has required fields
						const validQuestions = response.questions.filter(
							(q): q is TriviaQuestion =>
								isRecord(q) && typeof q.question === 'string' && Array.isArray(q.answers) && q.answers.length > 0
						);

						if (validQuestions.length > 0) {
							// Limit questions to gameQuestionCount if in QUESTION_LIMITED mode
							// The server may return more questions than requested, but we only play the requested amount
							const limitedQuestions =
								isQuestionLimited && gameQuestionCount !== undefined && gameQuestionCount !== null
									? validQuestions.slice(0, gameQuestionCount)
									: validQuestions;

							dispatch(setQuestions({ questions: limitedQuestions }));
							// Mark as loaded to prevent reload
							questionsLoadedRef.current = true;
							// Don't override gameQuestionCount - it's already set to the user's selected question count
							logger.gameInfo('Questions loaded successfully', {
								count: limitedQuestions.length,
								...(gameQuestionCount !== undefined && { questionsPerRequest: gameQuestionCount }),
								resultsCount: validQuestions.length,
							});

							// Start game session on server
							if (currentUser?.id && gameId) {
								dispatch(setLoading({ loading: true, loadingStep: GameLoadingStep.INITIALIZING_SESSION }));
								startGameSessionMutation.mutate({
									gameId,
									topic: currentTopic ?? 'General',
									difficulty: currentDifficulty ?? 'medium',
									gameMode: currentGameMode ?? GameMode.QUESTION_LIMITED,
								});
								// Track analytics event for game start
								dispatch(setLoading({ loading: true, loadingStep: GameLoadingStep.TRACKING_ANALYTICS }));
								trackAnalyticsEvent.mutate({
									eventType: AnalyticsEventType.GAME_START,
									page: AnalyticsPageName.GAME_SESSION,
									action: AnalyticsAction.GAME_STARTED,
									sessionId: gameId,
									properties: {
										topic: currentTopic ?? 'General',
										difficulty: currentDifficulty ?? 'medium',
										gameMode: currentGameMode ?? GameMode.QUESTION_LIMITED,
										questionCount: limitedQuestions.length,
									},
								});
							}

							dispatch(setLoading({ loading: true, loadingStep: GameLoadingStep.LOADING_AUDIO }));
							startGameMusic();
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
				const message = getErrorMessage(error);
				logger.gameError('Failed to load questions', { errorInfo: { message } });
				audioService.play(AudioKey.ERROR);
				setErrorMessage(message);
				setShowErrorDialog(true);
				dispatch(setLoading({ loading: false, loadingStep: GameLoadingStep.CONNECTING }));
				// Don't mark as loaded on error - allow retry if dependencies change
				setTimeout(() => handleClose(), TIME_PERIODS_MS.THREE_SECONDS);
			} finally {
				// Reset loading flag
				isLoadingRef.current = false;
			}
		};

		loadQuestions();

		// Cleanup on unmount
		return () => {
			// Resume background music when component unmounts
			// This handles cases where component unmounts without handleClose (e.g., navigation away)
			resumeBackgroundMusic();
		};
	}, [
		currentUser?.id,
		currentTopic,
		currentDifficulty,
		currentGameMode,
		gameId,
		startGameSessionMutation,
		triviaMutation,
		maxQuestionsPerGame,
		currentSettings?.answerCount,
		gameQuestionCount,
		handleClose,
		resumeBackgroundMusic,
		startGameMusic,
		isQuestionLimited,
		questions.length,
		trackAnalyticsEvent,
		dispatch,
	]);

	const handleGameTimeout = useCallback(() => {
		// Mark as finalized to prevent auto-finalization on unmount
		dispatch(finalizeGame());

		endGameMusic();

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

		// Finalize game session before navigating
		finalizeGameSession({
			navigateToSummary: true,
			trackAnalytics: false, // Will be tracked in summary view
			logContext: 'timeout',
		});
	}, [score, correctAnswers, currentQuestionIndex, gameStartTime, finalizeGameSession, endGameMusic, dispatch]);

	const recordQuestionData = useCallback(
		(isCorrect: boolean, timeSpent: number) => {
			if (!currentQuestion) return;

			// Use selectedAnswer if available, otherwise use -1 to indicate no answer (timeout)
			const userAnswer: number = selectedAnswer ?? -1;

			const questionData = createQuestionData(currentQuestion, userAnswer, isCorrect, timeSpent);
			dispatch(addQuestionData(questionData));
		},
		[currentQuestion, selectedAnswer, dispatch]
	);

	const moveToNextQuestion = useCallback(
		(wasCorrect: boolean, scoreEarned: number) => {
			// Check if game is complete based on mode
			const nextQuestionIndex = currentQuestionIndex + 1;
			const shouldEndGame =
				isQuestionLimited && gameQuestionCount
					? nextQuestionIndex >= gameQuestionCount // Question limit reached
					: false; // In time-limited, only time ends the game

			logger.gameInfo('Checking game completion', {
				currentQuestionIndex,
				nextQuestionIndex,
				...(gameQuestionCount !== undefined && { gameQuestionCount }),
				isQuestionLimited,
				shouldEndGame,
				sessionId: gameId ?? undefined,
			});

			if (shouldEndGame) {
				// Game over - finalize session on server and navigate to summary
				endGameMusic();

				// Finalize game session on server (server calculates final score)
				dispatch(finalizeGame());
				if (!gameId) return;
				finalizeGameSession({
					navigateToSummary: true,
					trackAnalytics: false, // Will be tracked in summary view
					logContext: 'question limit reached',
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
							if (savedHistory.questionsData) {
								dispatch(setQuestionsData(savedHistory.questionsData));
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
					endGameMusic();

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

					// Finalize game session before navigating
					finalizeGameSession({
						navigateToSummary: true,
						trackAnalytics: false, // Will be tracked in summary view
						logContext: 'no credits remaining',
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
							endGameMusic();

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

							// Finalize game session before navigating
							finalizeGameSession({
								navigateToSummary: true,
								trackAnalytics: false, // Will be tracked in summary view
								logContext: 'credit deduction failed',
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
			isQuestionLimited,
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
			endGameMusic,
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

		// Submit answer to server session - server calculates score
		if (!gameId) return;
		submitAnswerToSessionMutation.mutate(
			{
				gameId,
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

					recordQuestionData(isCorrect, timeSpent);

					setTimeout(() => {
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
		recordQuestionData,
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
		if (gameId && questions.length > 0 && !loading) {
			finalizeGameSession({
				navigateToSummary: false, // User is exiting, don't navigate
				trackAnalytics: false, // Don't track analytics on exit
				logContext: 'user exit',
			});
		}

		handleClose();
	}, [
		currentQuestionIndex,
		score,
		correctAnswers,
		handleClose,
		gameId,
		questions.length,
		loading,
		finalizeGameSession,
		dispatch,
	]);

	// Handle finishing the game in UNLIMITED mode (user chooses to end)
	const handleFinishUnlimitedGame = useCallback(() => {
		dispatch(finalizeGame());
		endGameMusic();

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

		// Finalize game session before navigating
		finalizeGameSession({
			navigateToSummary: true,
			trackAnalytics: false, // Will be tracked in summary view
			logContext: 'user finished',
		});
	}, [score, correctAnswers, currentQuestionIndex, gameStartTime, finalizeGameSession, dispatch, endGameMusic]);

	// Loading state
	if (loading) {
		return (
			<motion.main
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className='min-h-screen flex items-center justify-center'
			>
				<div className='text-center'>
					<Spinner size={SpinnerSize.FULL} variant='fullscreen' className='mx-auto mb-4' />
					<motion.p
						key={loadingStep}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className='text-xl text-foreground'
					>
						{loadingStep}
					</motion.p>
				</div>
			</motion.main>
		);
	}

	// No questions or invalid current question state
	if (!questions || questions.length === 0 || !currentQuestion) {
		return (
			<motion.main
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className='min-h-screen flex items-center justify-center'
			>
				<div className='text-center'>
					<p className='text-xl text-foreground mb-4'>
						{!questions || questions.length === 0 ? 'No questions available' : 'Loading question...'}
					</p>
					<BackToHomeButton />
				</div>
			</motion.main>
		);
	}

	return (
		<motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='min-h-screen py-4'>
			<div className='container mx-auto px-4 max-w-4xl h-screen flex flex-col'>
				{/* Header Section - Compact */}
				<div className='flex-shrink-0 mb-4'>
					{/* Game Timer with Stats - persists across all questions */}
					<div className='flex items-center justify-between gap-4 mb-3'>
						<GameTimer
							key='game-timer'
							mode={isTimeLimited ? 'countdown' : 'elapsed'}
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

					{/* Progress Bar - Only for QUESTION_LIMITED mode */}
					{isQuestionLimited && (
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

					{/* Answers - Two Columns Grid */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 flex-1 min-h-0'>
						{currentQuestion?.answers &&
						Array.isArray(currentQuestion.answers) &&
						currentQuestion.answers.length > 0 ? (
							currentQuestion.answers.map((answer, index) => (
								<AnswerButton
									key={index}
									answer={answer}
									index={index}
									answered={answered}
									selectedAnswer={selectedAnswer}
									currentQuestion={currentQuestion}
									onClick={handleAnswerSelect}
									showResult={false}
								/>
							))
						) : (
							<div className='col-span-2 text-center text-muted-foreground'>No answers available</div>
						)}
					</div>

					{/* Submit Button - Compact */}
					<Button
						onClick={handleSubmit}
						disabled={selectedAnswer === null || answered}
						size={ButtonSize.LG}
						className='w-full py-4 text-base mb-3 flex-shrink-0'
					>
						{answered ? 'Processing...' : 'Submit Answer'}
					</Button>

					{/* Feedback Message - Compact */}
					{answered && currentQuestion && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className='mb-2 text-center flex-shrink-0'
						>
							{(() => {
								const correctIndex = getCorrectAnswerIndex(currentQuestion);
								return selectedAnswer === correctIndex ? (
									<div className='text-green-500 text-lg font-bold'>
										Correct! {lastScoreEarned !== null ? `+${lastScoreEarned}` : ''} points
									</div>
								) : (
									<div className='text-red-500 text-lg font-bold'>
										Incorrect! The correct answer was {getAnswerLetter(correctIndex)}
									</div>
								);
							})()}
						</motion.div>
					)}

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
						<AlertDialogAction onClick={handleClose}>OK</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Credits Warning Dialog */}
			<AlertDialog open={showCreditsWarning} onOpenChange={setShowCreditsWarning}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Last Question Warning</AlertDialogTitle>
						<AlertDialogDescription>נשאר לך קרדיט אחד. זו תהיה השאלה האחרונה שלך.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction onClick={() => setShowCreditsWarning(false)}>Continue</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</motion.main>
	);
}
