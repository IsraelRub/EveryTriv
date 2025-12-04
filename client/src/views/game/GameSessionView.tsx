/**
 * Game Session View
 *
 * @module GameSessionView
 * @description Full game session with multiple questions, scoring, and progress tracking
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { GAME_MODE_DEFAULTS, GAME_STATE_DEFAULTS, GameMode, UserRole, VALIDATION_LIMITS } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { QuestionData, TriviaQuestion } from '@shared/types';
import { calculateAnswerScore, getErrorMessage, isRecord } from '@shared/utils';

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
	Progress,
} from '@/components';
import { AudioKey, ButtonSize } from '@/constants';
import { useAppDispatch, useAppSelector, useDeductCredits, useTriviaQuestionMutation } from '@/hooks';
import {
	selectCurrentDifficulty,
	selectCurrentGameMode,
	selectCurrentSettings,
	selectCurrentTopic,
	selectCurrentUser,
	selectUserRole,
} from '@/redux/selectors';
import { updateScore } from '@/redux/slices';
import { audioService } from '@/services';
import { formatTime } from '@/utils';

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

	// Dynamic limits based on game mode
	const maxQuestionsPerGame =
		currentSettings?.maxQuestionsPerGame ?? GAME_MODE_DEFAULTS[currentGameMode]?.maxQuestionsPerGame;

	const totalGameTime = isTimeLimited
		? currentSettings?.timeLimit || 60 // Default 60 seconds for time-limited mode
		: undefined;

	// Credit deduction
	const deductCredits = useDeductCredits();
	const [creditsDeducted, setCreditsDeducted] = useState(false);

	// Game state
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [gameQuestionCount, setGameQuestionCount] = useState<number | undefined>(
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
	const [gameTimer, setGameTimer] = useState(totalGameTime || 0); // Overall game timer for TIME_LIMITED
	const [streak, setStreak] = useState(0);

	// Modal state
	const [showExitDialog, setShowExitDialog] = useState(false);
	const [showErrorDialog, setShowErrorDialog] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

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

	// Deduct credits when game starts (not for admins)
	useEffect(() => {
		if (!isAdmin && !creditsDeducted && questions.length > 0) {
			// Convert undefined to UNLIMITED (-1) for API (questionsPerRequest must be a number)
			const questionsPerRequestForDeduction = maxQuestionsPerGame ?? VALIDATION_LIMITS.QUESTIONS.UNLIMITED;
			logger.gameInfo('Deducting credits for game', {
				questionsPerRequest: questionsPerRequestForDeduction,
				gameMode: currentGameMode,
			});
			deductCredits.mutate(
				{
					questionsPerRequest: questionsPerRequestForDeduction,
					gameMode: currentGameMode || GameMode.QUESTION_LIMITED,
				},
				{
					onSuccess: () => {
						logger.gameInfo('Credits deducted successfully');
						setCreditsDeducted(true);
					},
					onError: error => {
						logger.gameError('Failed to deduct credits', { error: getErrorMessage(error) });
						// Continue game even if deduction fails - server will handle
						setCreditsDeducted(true);
					},
				}
			);
		}
	}, [isAdmin, creditsDeducted, questions.length, currentGameMode, deductCredits, maxQuestionsPerGame]);

	// Load initial questions
	useEffect(() => {
		const loadQuestions = async () => {
			try {
				setLoading(true);
				// Convert undefined to UNLIMITED (-1) for API (questionsPerRequest must be a number)
				const questionsPerRequestForAPI = maxQuestionsPerGame ?? VALIDATION_LIMITS.QUESTIONS.UNLIMITED;
				logger.gameInfo('Loading trivia questions', {
					topic: currentTopic || GAME_STATE_DEFAULTS.TOPIC,
					difficulty: currentDifficulty || 'medium',
					questionsPerRequest: questionsPerRequestForAPI,
				});

				const response = await triviaMutation.mutateAsync({
					topic: currentTopic || GAME_STATE_DEFAULTS.TOPIC,
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
							setGameQuestionCount(validQuestions.length); // Update gameQuestionCount based on actual questions received
							logger.gameInfo('Questions loaded successfully', { count: validQuestions.length });
						} else {
							throw new Error('No valid questions in response');
						}
					} else {
						throw new Error('No questions returned from API');
					}
				} else {
					throw new Error('Invalid response format from trivia API');
				}

				setLoading(false);
				audioService.stop(AudioKey.BACKGROUND_MUSIC);
				audioService.play(AudioKey.GAME_START);
				audioService.play(AudioKey.GAME_MUSIC);
			} catch (error) {
				const message = getErrorMessage(error);
				logger.gameError('Failed to load questions', { error: message });
				audioService.play(AudioKey.ERROR);
				setErrorMessage('Failed to load questions. Returning to home.');
				setShowErrorDialog(true);
				setTimeout(() => navigate('/'), 3000);
			}
		};

		loadQuestions();

		// Cleanup on unmount
		return () => {
			audioService.stop(AudioKey.GAME_MUSIC);
			// Small delay to ensure stop() completes before starting background music
			setTimeout(() => {
				audioService.play(AudioKey.BACKGROUND_MUSIC);
			}, 100);
		};
	}, []);

	// Use ref to store the latest handleGameTimeout function
	const handleGameTimeoutRef = useRef<() => void>();

	const handleGameTimeout = useCallback(() => {
		audioService.stop(AudioKey.GAME_MUSIC);
		audioService.play(AudioKey.GAME_END);
		// Small delay to ensure stop() completes before starting background music
		setTimeout(() => {
			audioService.play(AudioKey.BACKGROUND_MUSIC);
		}, 100);

		logger.gameInfo('Game time expired', {
			score,
			correctAnswers,
		});

		navigate('/game/summary', {
			state: {
				score,
				gameQuestionCount: currentQuestionIndex + 1,
				correctAnswers,
				topic: currentTopic,
				difficulty: currentDifficulty,
				timeSpent: totalGameTime,
				questionsData,
			},
		});
	}, [
		score,
		correctAnswers,
		currentQuestionIndex,
		totalGameTime,
		questionsData,
		currentTopic,
		currentDifficulty,
		navigate,
	]);

	// Update ref when handleGameTimeout changes
	useEffect(() => {
		handleGameTimeoutRef.current = handleGameTimeout;
	}, [handleGameTimeout]);

	// Initialize timer when game starts (only once)
	const timerInitialized = useRef(false);
	useEffect(() => {
		if (isTimeLimited && totalGameTime && !loading && !timerInitialized.current) {
			setGameTimer(totalGameTime);
			timerInitialized.current = true;
		}
	}, [isTimeLimited, totalGameTime, loading]);

	// Overall game timer (for TIME_LIMITED mode only)
	useEffect(() => {
		if (!isTimeLimited || !totalGameTime || loading) return;

		const interval = setInterval(() => {
			setGameTimer((prev: number) => {
				if (prev <= 1) {
					handleGameTimeoutRef.current?.();
					return 0;
				}
				// Play warning sound at 10 seconds
				if (prev === 11) {
					audioService.play(AudioKey.TIME_WARNING);
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [isTimeLimited, totalGameTime, loading]);

	const recordQuestionData = useCallback(
		(isCorrect: boolean, timeSpent: number) => {
			if (!currentQuestion) return;

			const correctAnswerText = currentQuestion.answers[currentQuestion.correctAnswerIndex]?.text || '';

			setQuestionsData(prev => [
				...prev,
				{
					question: currentQuestion.question,
					userAnswer: isCorrect ? correctAnswerText : selectedAnswer !== null ? 'Incorrect' : 'Timeout',
					correctAnswer: correctAnswerText,
					isCorrect,
					timeSpent,
				},
			]);
		},
		[currentQuestion, selectedAnswer]
	);

	const moveToNextQuestion = useCallback(
		(wasCorrect: boolean, scoreEarned: number) => {
			// Check if game is complete based on mode
			const shouldEndGame =
				isQuestionLimited && gameQuestionCount
					? currentQuestionIndex + 1 >= gameQuestionCount // Question limit reached
					: false; // In time-limited, only time ends the game

			if (shouldEndGame) {
				// Game over - navigate to summary
				audioService.stop(AudioKey.GAME_MUSIC);
				audioService.play(AudioKey.GAME_END);
				// Small delay to ensure stop() completes before starting background music
				setTimeout(() => {
					audioService.play(AudioKey.BACKGROUND_MUSIC);
				}, 100);

				const totalTimeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
				const finalScore = wasCorrect ? score + scoreEarned : score;
				const finalCorrectAnswers = wasCorrect ? correctAnswers + 1 : correctAnswers;

				logger.gameInfo('Game completed', {
					score: finalScore,
					correctAnswers: finalCorrectAnswers,
					gameQuestionCount,
					timeSpent: totalTimeSpent,
				});

				navigate('/game/summary', {
					state: {
						score: finalScore,
						gameQuestionCount: gameQuestionCount ?? questions.length,
						correctAnswers: finalCorrectAnswers,
						topic: currentTopic,
						difficulty: currentDifficulty,
						timeSpent: totalTimeSpent,
						questionsData,
					},
				});
			} else {
				// Next question - reset state
				setCurrentQuestionIndex(prev => prev + 1);
				setSelectedAnswer(null);
				setAnswered(false);
			}
		},
		[
			isQuestionLimited,
			currentQuestionIndex,
			gameQuestionCount,
			questions.length,
			gameStartTime,
			score,
			correctAnswers,
			currentTopic,
			currentDifficulty,
			questionsData,
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
		const timeSpent = 30; // Default time for scoring calculation

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
					responseTime: timeSpent,
					correct: true,
					totalTime: 30,
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
					responseTime: timeSpent,
					correct: false,
					totalTime: 30,
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
		// Small delay to ensure stop() completes before starting background music
		setTimeout(() => {
			audioService.play(AudioKey.BACKGROUND_MUSIC);
		}, 100);
		logger.gameInfo('User exited game', {
			currentQuestionIndex: currentQuestionIndex + 1,
			score,
			correctAnswers,
		});
		navigate('/');
	}, [currentQuestionIndex, score, correctAnswers, navigate]);

	const getGameTimerColor = useCallback(() => {
		if (!totalGameTime) return 'text-foreground';
		const percentage = (gameTimer / totalGameTime) * 100;
		if (percentage > 50) return 'text-green-500';
		if (percentage > 25) return 'text-yellow-500';
		return 'text-red-500';
	}, [gameTimer, totalGameTime]);

	const getGameTimerBarColor = useCallback(() => {
		if (!totalGameTime) return 'bg-primary';
		const percentage = (gameTimer / totalGameTime) * 100;
		if (percentage > 50) return 'bg-green-500';
		if (percentage > 25) return 'bg-yellow-500';
		return 'bg-red-500';
	}, [gameTimer, totalGameTime]);

	const formatTimeLocal = useCallback((seconds: number): string => {
		return formatTime(seconds);
	}, []);

	const getAnswerStyle = useCallback(
		(index: number) => {
			if (!answered) {
				return selectedAnswer === index
					? 'border-primary bg-primary/10'
					: 'border-border hover:border-primary/50 hover:bg-accent/50';
			}

			// Show correct/incorrect after answer
			if (index === currentQuestion?.correctAnswerIndex) {
				return 'border-green-500 bg-green-500/20';
			}
			if (index === selectedAnswer) {
				return 'border-red-500 bg-red-500/20';
			}
			return 'border-border opacity-50';
		},
		[answered, selectedAnswer, currentQuestion?.correctAnswerIndex]
	);

	// Loading state
	if (loading) {
		return (
			<motion.main
				role='main'
				aria-label='Loading Game'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className='min-h-screen flex items-center justify-center'
			>
				<div className='text-center'>
					<div className='spinner-pulsing h-16 w-16 mx-auto mb-4' />
					<p className='text-xl text-foreground'>Loading your trivia questions...</p>
				</div>
			</motion.main>
		);
	}

	// No questions or invalid current question state
	if (!questions || questions.length === 0 || !currentQuestion) {
		return (
			<motion.main
				role='main'
				aria-label='No Questions'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className='min-h-screen flex items-center justify-center'
			>
				<div className='text-center'>
					<p className='text-xl text-foreground mb-4'>
						{!questions || questions.length === 0 ? 'No questions available' : 'Loading question...'}
					</p>
					<Button onClick={() => navigate('/')}>Return Home</Button>
				</div>
			</motion.main>
		);
	}

	return (
		<motion.main
			role='main'
			aria-label='Game Session'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className='min-h-screen py-8'
		>
			<div className='container mx-auto px-4 max-w-3xl'>
				{/* Game Timer - Only for TIME_LIMITED mode */}
				{isTimeLimited && totalGameTime && (
					<div className='mb-6'>
						<div className='flex justify-between items-center mb-2'>
							<span className='text-sm text-muted-foreground'>Game Time</span>
							<span className={`text-sm font-bold ${getGameTimerColor()}`}>{formatTimeLocal(gameTimer)}</span>
						</div>
						<div className='relative h-3 bg-muted rounded-full overflow-hidden'>
							<motion.div
								className={`absolute inset-y-0 left-0 ${getGameTimerBarColor()}`}
								initial={{ width: '100%' }}
								animate={{
									width: `${(gameTimer / totalGameTime) * 100}%`,
								}}
								transition={{ duration: 0.3 }}
							/>
						</div>
					</div>
				)}

				{/* Progress Bar - Only for QUESTION_LIMITED mode */}
				{isQuestionLimited && (
					<div className='mb-8'>
						<div className='flex justify-between items-center mb-2'>
							<span className='text-foreground font-medium'>
								Question {currentQuestionIndex + 1} of {gameQuestionCount}
							</span>
							<span className='text-primary font-bold'>Score: {score}</span>
						</div>
						<Progress value={progress} className='h-3' />
					</div>
				)}

				{/* Game Info */}
				<div className='mb-6 text-center'>
					<div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
						<span>Topic: {currentTopic || 'General'}</span>
						<span className='text-muted-foreground/50'>•</span>
						<span>Difficulty: {currentDifficulty || 'Medium'}</span>
						{streak > 1 && (
							<>
								<span className='text-muted-foreground/50'>•</span>
								<span className='text-primary font-medium'>Streak: {streak}</span>
							</>
						)}
					</div>
				</div>

				{/* Game Time Elapsed - For non-time-limited modes */}
				{!isTimeLimited && (
					<div className='text-center mb-6'>
						<div className='text-2xl font-medium text-muted-foreground'>
							{formatTimeLocal(Math.floor((Date.now() - gameStartTime) / 1000))}
						</div>
						<p className='text-sm text-muted-foreground mt-1'>Time Elapsed</p>
					</div>
				)}

				{/* Question Card */}
				<Card className='p-8 mb-6'>
					<p className='text-2xl text-foreground font-medium text-center'>{currentQuestion?.question}</p>
				</Card>

				{/* Answers */}
				<div className='space-y-4 mb-6'>
					{currentQuestion?.answers && Array.isArray(currentQuestion.answers) && currentQuestion.answers.length > 0 ? (
						currentQuestion.answers.map((answer, index) => (
							<motion.button
								key={index}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								onClick={() => handleAnswerSelect(index)}
								disabled={answered}
								className={`w-full p-6 rounded-lg border-2 transition-all text-left ${getAnswerStyle(index)} ${
									!answered ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-not-allowed'
								}`}
							>
								<div className='flex items-center'>
									<div className='w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-4 flex-shrink-0'>
										<span className='font-bold'>{String.fromCharCode(65 + index)}</span>
									</div>
									<span className='text-lg'>{answer.text}</span>
								</div>
							</motion.button>
						))
					) : (
						<div className='text-center text-muted-foreground'>No answers available</div>
					)}
				</div>

				{/* Submit Button */}
				<Button
					onClick={handleSubmit}
					disabled={selectedAnswer === null || answered}
					size={ButtonSize.LG}
					className='w-full py-6 text-lg'
				>
					{answered ? 'Processing...' : 'Submit Answer'}
				</Button>

				{/* Feedback Message */}
				{answered && currentQuestion && (
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mt-6 text-center'>
						{selectedAnswer === currentQuestion.correctAnswerIndex ? (
							<div className='text-green-500 text-xl font-bold'>Correct! +{score} points</div>
						) : (
							<div className='text-red-500 text-xl font-bold'>
								Incorrect! The correct answer was {String.fromCharCode(65 + currentQuestion.correctAnswerIndex)}
							</div>
						)}
					</motion.div>
				)}

				{/* Exit Button */}
				<div className='mt-8 text-center'>
					<button
						onClick={() => setShowExitDialog(true)}
						className='text-muted-foreground hover:text-foreground transition-colors'
					>
						Exit Game
					</button>
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
						<AlertDialogAction onClick={() => navigate('/')}>OK</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</motion.main>
	);
}
