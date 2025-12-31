/**
 * Game Session View
 *
 * @module GameSessionView
 * @description Full game session with multiple questions, scoring, and progress tracking
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
	ERROR_MESSAGES,
	GAME_MODES_CONFIG,
	GAME_STATE_CONFIG,
	GameMode,
	UserRole,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { QuestionData, TriviaQuestion } from '@shared/types';
import {
	calculateAnswerScore,
	calculateElapsedSeconds,
	calculateRequiredCredits,
	createQuestionData,
	getErrorMessage,
	isRecord,
	shouldChargeAfterGame,
} from '@shared/utils';
import { AudioKey, ButtonSize, ButtonVariant, ROUTES, SpinnerSize, SpinnerVariant } from '@/constants';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Card,
	GameTimer,
	Progress,
	Spinner,
} from '@/components';
import { useAppDispatch, useAppSelector, useDeductCredits, useTriviaQuestionMutation } from '@/hooks';
import { audioService, clientLogger as logger } from '@/services';
import { cn } from '@/utils';
import {
	selectCurrentDifficulty,
	selectCurrentGameMode,
	selectCurrentSettings,
	selectCurrentTopic,
	selectCurrentUser,
	selectUserCreditBalance,
	selectUserRole,
} from '@/redux/selectors';
import { updateScore } from '@/redux/slices';

export function GameSessionView() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const currentUser = useAppSelector(selectCurrentUser);
	const currentTopic = useAppSelector(selectCurrentTopic);
	const currentDifficulty = useAppSelector(selectCurrentDifficulty);
	const currentGameMode = useAppSelector(selectCurrentGameMode);
	const currentSettings = useAppSelector(selectCurrentSettings);
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	// Game mode configuration
	const isQuestionLimited = currentGameMode === GameMode.QUESTION_LIMITED;
	const isTimeLimited = currentGameMode === GameMode.TIME_LIMITED;
	const isUnlimited = currentGameMode === GameMode.UNLIMITED;

	// Dynamic limits based on game mode
	const maxQuestionsPerGame =
		currentSettings?.maxQuestionsPerGame ?? GAME_MODES_CONFIG[currentGameMode]?.defaults.maxQuestionsPerGame;

	const totalGameTime = isTimeLimited
		? currentSettings?.timeLimit || 60 // Default 60 seconds for time-limited mode
		: undefined;

	// Credit deduction
	const deductCredits = useDeductCredits();
	const [creditsDeducted, setCreditsDeducted] = useState(false);

	// Game state
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [gameQuestionCount] = useState<number | undefined>(
		isQuestionLimited && maxQuestionsPerGame !== undefined && maxQuestionsPerGame !== null
			? maxQuestionsPerGame
			: undefined
	);
	const [score, setScore] = useState(0);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
	const [loading, setLoading] = useState(true);
	const [gameStartTime] = useState(Date.now());
	const [questionsData, setQuestionsData] = useState<QuestionData[]>([]);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [answered, setAnswered] = useState(false);
	const [streak, setStreak] = useState(0);

	// Modal state
	const [showExitDialog, setShowExitDialog] = useState(false);
	const [showErrorDialog, setShowErrorDialog] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [showCreditsWarning, setShowCreditsWarning] = useState(false);

	// Credit balance tracking
	const creditBalance = useAppSelector(selectUserCreditBalance);

	const triviaMutation = useTriviaQuestionMutation();

	const currentQuestion = useMemo(() => {
		if (!questions || questions.length === 0 || currentQuestionIndex >= questions.length) {
			return null;
		}
		const question = questions[currentQuestionIndex];
		// Validate question structure
		if (!question || !question.answers || !Array.isArray(question.answers)) {
			return null;
		}
		return question;
	}, [questions, currentQuestionIndex]);

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
				setCreditsDeducted(true);
			}
			return;
		}

		// Calculate credits based on game mode:
		// - TIME_LIMITED: 5 credits per 30 seconds (use totalGameTime in seconds)
		// - UNLIMITED: 1 credit for the first question
		// - Others: 1 credit per question (total for all questions)
		const gameMode = currentGameMode || GameMode.QUESTION_LIMITED;

		// For TIME_LIMITED, send time in seconds (server expects time for credit calculation)
		// For UNLIMITED, send 1 (first question only)
		// For others, send question count
		const valueForDeduction = isTimeLimited
			? (totalGameTime ?? 60) // Time in seconds for TIME_LIMITED mode
			: isUnlimited
				? 1 // 1 credit for first question in UNLIMITED mode
				: (maxQuestionsPerGame ?? VALIDATION_COUNT.QUESTIONS.MAX); // Question count

		const requiredCredits = calculateRequiredCredits(valueForDeduction, gameMode);

		logger.gameInfo('Deducting credits for game', {
			questionsPerRequest: valueForDeduction,
			gameMode,
		});

		// Mark as deducted immediately to prevent duplicate calls
		setCreditsDeducted(true);
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
					logger.gameError('Failed to deduct credits', { error: message });
					// Show error to user and navigate back
					audioService.play(AudioKey.ERROR);
					setErrorMessage(message);
					setShowErrorDialog(true);
				},
			}
		);
	}, [isAdmin, isChargeAfterGame, creditsDeducted, questions.length, currentGameMode, maxQuestionsPerGame, totalGameTime, isTimeLimited, isUnlimited, deductCredits.isPending]);


	// Load initial questions
	useEffect(() => {
		const loadQuestions = async () => {
			try {
				setLoading(true);
				// Convert undefined to UNLIMITED (-1) for API (questionsPerRequest must be a number)
				const questionsPerRequestForAPI = maxQuestionsPerGame ?? VALIDATION_COUNT.QUESTIONS.UNLIMITED;
				logger.gameInfo('Loading trivia questions', {
					topic: currentTopic || GAME_STATE_CONFIG.defaults.topic,
					difficulty: currentDifficulty || 'medium',
					questionsPerRequest: questionsPerRequestForAPI,
				});

				const response = await triviaMutation.mutateAsync({
					topic: currentTopic || GAME_STATE_CONFIG.defaults.topic,
					difficulty: currentDifficulty || 'medium',
					questionsPerRequest: questionsPerRequestForAPI,
					userId: currentUser?.id || '',
					answerCount: currentSettings?.answerCount,
				});

				// API returns an object with questions array and fromCache flag
				if (response && isRecord(response) && 'questions' in response) {
					const questionsData = response.questions;

					// Validate we got an array of questions
					if (Array.isArray(questionsData) && questionsData.length > 0) {
						// Validate each question has required fields
						const validQuestions = questionsData.filter(
							(q): q is TriviaQuestion =>
								isRecord(q) && typeof q.question === 'string' && Array.isArray(q.answers) && q.answers.length > 0
						);

						if (validQuestions.length > 0) {
							setQuestions(validQuestions);
							// Don't override gameQuestionCount - it's already set to the user's selected question count
							// The server may return more questions than requested, but we only play the requested amount
							logger.gameInfo('Questions loaded successfully', { count: validQuestions.length });
						} else {
							throw new Error(ERROR_MESSAGES.api.NO_VALID_QUESTIONS_IN_RESPONSE);
						}
					} else {
						throw new Error(ERROR_MESSAGES.api.NO_QUESTIONS_RETURNED);
					}
				} else {
					throw new Error(ERROR_MESSAGES.api.INVALID_API_RESPONSE_STRUCTURE);
				}

				setLoading(false);
				audioService.stop(AudioKey.BACKGROUND_MUSIC);
				audioService.play(AudioKey.GAME_START);
				audioService.play(AudioKey.GAME_MUSIC);
			} catch (error) {
				const message = getErrorMessage(error);
				logger.gameError('Failed to load questions', { error: message });
				audioService.play(AudioKey.ERROR);
				setErrorMessage(message);
				setShowErrorDialog(true);
				setTimeout(() => navigate(ROUTES.HOME), 3000);
			}
		};

		loadQuestions();

		// Cleanup on unmount
		return () => {
			audioService.stop(AudioKey.GAME_MUSIC);
			// AudioControls will handle background music based on preferences
		};
	}, []);

	// Use ref to store the latest handleGameTimeout function
	const handleGameTimeoutRef = useRef<() => void>();

	const handleGameTimeout = useCallback(() => {
		audioService.stop(AudioKey.GAME_MUSIC);
		audioService.play(AudioKey.GAME_END);
		// AudioControls will handle background music based on preferences

		const totalTimeSpent = calculateElapsedSeconds(gameStartTime);
		const questionsAnswered = currentQuestionIndex + 1;

		logger.gameInfo('Game time expired', {
			score,
			correctAnswers,
			timeSpent: totalTimeSpent,
		});

		navigate(ROUTES.GAME_SUMMARY, {
			state: {
				userId: currentUser?.id || '',
				score,
				gameQuestionCount: questionsAnswered,
				correctAnswers,
				topic: currentTopic,
				difficulty: currentDifficulty,
				timeSpent: totalTimeSpent,
				questionsData,
			},
		});
	}, [
		score,
		correctAnswers,
		currentQuestionIndex,
		gameStartTime,
		questionsData,
		currentTopic,
		currentDifficulty,
		currentUser?.id,
		navigate,
	]);

	// Update ref when handleGameTimeout changes
	useEffect(() => {
		handleGameTimeoutRef.current = handleGameTimeout;
	}, [handleGameTimeout]);

	const recordQuestionData = useCallback(
		(isCorrect: boolean, timeSpent: number) => {
			if (!currentQuestion) return;

			// Convert selectedAnswer to appropriate format for createQuestionData
			const userAnswer: string | number =
				selectedAnswer !== null ? selectedAnswer : isCorrect ? currentQuestion.correctAnswerIndex : 'Timeout';

			const questionData = createQuestionData(currentQuestion, userAnswer, isCorrect, timeSpent);
			setQuestionsData(prev => [...prev, questionData]);
		},
		[currentQuestion, selectedAnswer]
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
				gameQuestionCount,
				isQuestionLimited,
				shouldEndGame,
			});

			if (shouldEndGame) {
				// Game over - navigate to summary
				audioService.stop(AudioKey.GAME_MUSIC);
				audioService.play(AudioKey.GAME_END);
				// AudioControls will handle background music based on preferences

				const totalTimeSpent = calculateElapsedSeconds(gameStartTime);
				const finalScore = wasCorrect ? score + scoreEarned : score;
				const finalCorrectAnswers = wasCorrect ? correctAnswers + 1 : correctAnswers;

				logger.gameInfo('Game completed', {
					score: finalScore,
					correctAnswers: finalCorrectAnswers,
					gameQuestionCount,
					timeSpent: totalTimeSpent,
				});

				navigate(ROUTES.GAME_SUMMARY, {
					state: {
						userId: currentUser?.id || '',
						score: finalScore,
						gameQuestionCount: gameQuestionCount ?? questions.length,
						correctAnswers: finalCorrectAnswers,
						topic: currentTopic,
						difficulty: currentDifficulty,
						timeSpent: totalTimeSpent,
						questionsData,
					},
				});
			} else if (isUnlimited && !isAdmin) {
				// For UNLIMITED mode, deduct credit for the next question
				// Check if user has enough credits before proceeding
				const currentTotalCredits = creditBalance?.totalCredits ?? 0;

				if (currentTotalCredits <= 0) {
					// No credits left - end game
					audioService.stop(AudioKey.GAME_MUSIC);
					audioService.play(AudioKey.GAME_END);

					const totalTimeSpent = calculateElapsedSeconds(gameStartTime);
					const finalScore = wasCorrect ? score + scoreEarned : score;
					const finalCorrectAnswers = wasCorrect ? correctAnswers + 1 : correctAnswers;

					logger.gameInfo('Game ended - no credits remaining', {
						score: finalScore,
						correctAnswers: finalCorrectAnswers,
						questionsAnswered: nextQuestionIndex,
					});

					navigate(ROUTES.GAME_SUMMARY, {
						state: {
							userId: currentUser?.id || '',
							score: finalScore,
							gameQuestionCount: nextQuestionIndex,
							correctAnswers: finalCorrectAnswers,
							topic: currentTopic,
							difficulty: currentDifficulty,
							timeSpent: totalTimeSpent,
							questionsData,
						},
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
								setCurrentQuestionIndex(prev => prev + 1);
								setSelectedAnswer(null);
								setAnswered(false);
							} else {
								// Move to next question
								setCurrentQuestionIndex(prev => prev + 1);
								setSelectedAnswer(null);
								setAnswered(false);
							}
						},
						onError: error => {
							const message = getErrorMessage(error);
							logger.gameError('Failed to deduct credits for next question', { error: message });
							// If deduction fails due to insufficient credits, end game
							audioService.stop(AudioKey.GAME_MUSIC);
							audioService.play(AudioKey.GAME_END);

							const totalTimeSpent = calculateElapsedSeconds(gameStartTime);
							const finalScore = wasCorrect ? score + scoreEarned : score;
							const finalCorrectAnswers = wasCorrect ? correctAnswers + 1 : correctAnswers;

							navigate(ROUTES.GAME_SUMMARY, {
								state: {
									userId: currentUser?.id || '',
									score: finalScore,
									gameQuestionCount: nextQuestionIndex,
									correctAnswers: finalCorrectAnswers,
									topic: currentTopic,
									difficulty: currentDifficulty,
									timeSpent: totalTimeSpent,
									questionsData,
								},
							});
						},
					}
				);
			} else {
				// Next question - reset state
				setCurrentQuestionIndex(prev => prev + 1);
				setSelectedAnswer(null);
				setAnswered(false);
			}
		},
		[
			isQuestionLimited,
			isUnlimited,
			isAdmin,
			currentQuestionIndex,
			gameQuestionCount,
			questions.length,
			gameStartTime,
			score,
			correctAnswers,
			currentTopic,
			currentDifficulty,
			questionsData,
			creditBalance,
			deductCredits,
			currentUser?.id,
			navigate,
		]
	);

	const handleAnswerSelect = useCallback(
		(answerIndex: number) => {
			if (answered) return;
			audioService.play(AudioKey.BUTTON_CLICK);
			setSelectedAnswer(answerIndex);
		},
		[answered]
	);

	const handleSubmit = useCallback(() => {
		if (answered || selectedAnswer === null || !currentQuestion) return;

		setAnswered(true);
		const isCorrect = selectedAnswer === currentQuestion.correctAnswerIndex;
		const timeSpent = 30; // Default time for scoring calculation (in seconds)

		if (isCorrect) {
			const newStreak = streak + 1;
			setStreak(newStreak);

			const scoreEarned = calculateAnswerScore(currentQuestion.difficulty, timeSpent, newStreak - 1, true);

			setScore(prev => prev + scoreEarned);
			setCorrectAnswers(prev => prev + 1);

			// Update Redux state
			dispatch(
				updateScore({
					score: scoreEarned,
					timeSpent,
					isCorrect: true,
				})
			);

			audioService.play(AudioKey.CORRECT_ANSWER);
			logger.gameInfo('Correct answer', {
				questionId: currentQuestion.id,
				score: scoreEarned,
			});

			recordQuestionData(true, timeSpent);

			setTimeout(() => {
				moveToNextQuestion(true, scoreEarned);
			}, 1500);
		} else {
			setStreak(0);

			// Update Redux state for incorrect answer
			dispatch(
				updateScore({
					score: 0,
					timeSpent,
					isCorrect: false,
				})
			);

			audioService.play(AudioKey.WRONG_ANSWER);
			logger.gameInfo('Incorrect answer', {
				questionId: currentQuestion.id,
				selectedAnswer: selectedAnswer.toString(),
				correctAnswer: currentQuestion.correctAnswerIndex,
			});

			recordQuestionData(false, timeSpent);

			setTimeout(() => {
				moveToNextQuestion(false, 0);
			}, 1500);
		}
	}, [
		answered,
		selectedAnswer,
		currentQuestion,
		gameStartTime,
		streak,
		dispatch,
		recordQuestionData,
		moveToNextQuestion,
	]);

	const handleExitGame = useCallback(() => {
		audioService.stop(AudioKey.GAME_MUSIC);
		// AudioControls will handle background music based on preferences
		logger.gameInfo('User exited game', {
			currentQuestionIndex: currentQuestionIndex + 1,
			score,
			correctAnswers,
		});
		navigate(ROUTES.HOME);
	}, [currentQuestionIndex, score, correctAnswers, navigate]);

	// Handle finishing the game in UNLIMITED mode (user chooses to end)
	const handleFinishUnlimitedGame = useCallback(() => {
		audioService.stop(AudioKey.GAME_MUSIC);
		audioService.play(AudioKey.GAME_END);

		const totalTimeSpent = calculateElapsedSeconds(gameStartTime);
		const questionsAnswered = currentQuestionIndex + 1;

		logger.gameInfo('User finished UNLIMITED game', {
			score,
			correctAnswers,
			questionsPerRequest: questionsAnswered,
		});

		navigate(ROUTES.GAME_SUMMARY, {
			state: {
				userId: currentUser?.id || '',
				score,
				gameQuestionCount: questionsAnswered,
				correctAnswers,
				topic: currentTopic,
				difficulty: currentDifficulty,
				timeSpent: totalTimeSpent,
				questionsData,
			},
		});
	}, [
		score,
		correctAnswers,
		currentQuestionIndex,
		gameStartTime,
		questionsData,
		currentTopic,
		currentDifficulty,
		currentUser?.id,
		navigate,
	]);

	const getAnswerStyle = useCallback(
		(index: number) => {
			if (!answered) {
				return selectedAnswer === index
					? cn('bg-blue-500/50', 'ring-2', 'ring-blue-500/70')
					: 'hover:bg-accent/50';
			}

			if (index === currentQuestion?.correctAnswerIndex) {
				return cn('bg-green-500/40', 'ring-2', 'ring-green-500/70');
			}
			if (index === selectedAnswer) {
				return cn('bg-red-500/40', 'ring-2', 'ring-red-500/70');
			}
			return 'opacity-50';
		},
		[answered, selectedAnswer, currentQuestion?.correctAnswerIndex]
	);

	// Loading state
	if (loading) {
		return (
			<motion.main
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className='min-h-screen flex items-center justify-center'
			>
				<div className='text-center'>
					<Spinner variant={SpinnerVariant.FULL_SCREEN} size={SpinnerSize.FULL} className='mx-auto mb-4' />
					<p className='text-xl text-foreground'>Loading your trivia questions...</p>
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
					<Button onClick={() => navigate(ROUTES.HOME)}>Return Home</Button>
				</div>
			</motion.main>
		);
	}

	return (
		<motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='min-h-screen py-4'>
			<div className='container mx-auto px-4 max-w-4xl h-screen flex flex-col'>
				{/* Header Section - Compact */}
				<div className='flex-shrink-0 mb-4'>
					{/* Game Timer - persists across all questions */}
					<GameTimer
						key='game-timer'
						mode={isTimeLimited ? 'countdown' : 'elapsed'}
						initialTime={isTimeLimited ? totalGameTime : undefined}
						startTime={gameStartTime}
						onTimeout={isTimeLimited ? handleGameTimeout : undefined}
						label={isTimeLimited ? 'Game Time' : 'Time Elapsed'}
						showProgressBar={isTimeLimited}
					/>

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
							<span>Topic: {currentTopic || GAME_STATE_CONFIG.defaults.topic}</span>
							<span className='text-muted-foreground/50'>•</span>
							<span>Difficulty: {currentDifficulty || GAME_STATE_CONFIG.defaults.difficulty}</span>
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
								<motion.button
									key={index}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
									onClick={() => handleAnswerSelect(index)}
									disabled={answered}
									className={cn(
										'p-4 rounded-lg border-2 border-white transition-all text-left h-full flex items-center',
										getAnswerStyle(index),
										!answered ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'cursor-not-allowed'
									)}
								>
									<div className='flex items-center w-full'>
										<div className='w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-3 flex-shrink-0'>
											<span className='font-bold text-sm'>{String.fromCharCode(65 + index)}</span>
										</div>
										<span className='text-base leading-tight flex-1'>{answer.text}</span>
									</div>
								</motion.button>
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
							{selectedAnswer === currentQuestion.correctAnswerIndex ? (
								<div className='text-green-500 text-lg font-bold'>Correct! +{score} points</div>
							) : (
								<div className='text-red-500 text-lg font-bold'>
									Incorrect! The correct answer was {String.fromCharCode(65 + currentQuestion.correctAnswerIndex)}
								</div>
							)}
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
								Finish Game ({currentQuestionIndex + 1} questions)
							</Button>
						)}
						<button
							onClick={() => setShowExitDialog(true)}
							className='text-xs text-muted-foreground hover:text-foreground transition-colors'
						>
							Exit Game
						</button>
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
						<AlertDialogAction onClick={handleExitGame}>Quit Game</AlertDialogAction>
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
						<AlertDialogAction onClick={() => navigate(ROUTES.HOME)}>OK</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Credits Warning Dialog */}
			<AlertDialog open={showCreditsWarning} onOpenChange={setShowCreditsWarning}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Last Question Warning</AlertDialogTitle>
						<AlertDialogDescription>
							נשאר לך קרדיט אחד. זו תהיה השאלה האחרונה שלך.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction onClick={() => setShowCreditsWarning(false)}>המשך</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</motion.main>
	);
}
