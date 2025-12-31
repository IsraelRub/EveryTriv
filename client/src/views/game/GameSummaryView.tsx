/**
 * Game Summary View
 *
 * @module GameSummaryView
 * @description Displays game completion summary with score, statistics, and question breakdown
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Clock, Star, Target, Trophy, XCircle } from 'lucide-react';

import { DifficultyLevel, GameMode } from '@shared/constants';
import type { GameData, GameDifficulty } from '@shared/types';
import { calculatePercentage } from '@shared/utils';
import { isGameDifficulty } from '@shared/validation';
import { AudioKey, ButtonSize, ROUTES } from '@/constants';
import { Button, Card, SocialShare } from '@/components';
import { useAppSelector, useCountUp, useSaveHistory, useUserAnalytics } from '@/hooks';
import { audioService, clientLogger as logger } from '@/services';
import type { GameSummaryStats } from '@/types';
import { cn, calculateGrade, formatTime, isGameSummaryNavigationState } from '@/utils';
import { selectCurrentGameMode, selectCurrentUser } from '@/redux/selectors';

export function GameSummaryView() {
	const navigate = useNavigate();
	const location = useLocation();
	const saveHistoryMutation = useSaveHistory();
	const currentGameMode = useAppSelector(selectCurrentGameMode);
	const currentUser = useAppSelector(selectCurrentUser);
	const { data: analytics } = useUserAnalytics();

	// Get game data from navigation state
	const gameState = isGameSummaryNavigationState(location.state) ? location.state : null;

	const gameStats = useMemo((): GameSummaryStats => {
		if (!gameState) {
			return {
				score: 0,
				correct: 0,
				total: 0,
				time: '0:00',
				percentage: 0,
				topic: 'Unknown',
				difficulty: DifficultyLevel.MEDIUM,
				questionsData: [],
			};
		}

		const time = formatTime(gameState.timeSpent);
		const percentage = calculatePercentage(gameState.correctAnswers, gameState.gameQuestionCount);

		return {
			score: gameState.score,
			correct: gameState.correctAnswers,
			total: gameState.gameQuestionCount,
			time,
			percentage,
			topic: gameState.topic || 'General',
			difficulty: gameState.difficulty || DifficultyLevel.MEDIUM,
			questionsData: gameState.questionsData || [],
		};
	}, [gameState]);

	// Calculate grade with stars
	const grade = useMemo(() => {
		return calculateGrade(gameStats.percentage);
	}, [gameStats.percentage]);

	// Track which stars have appeared
	const [visibleStars, setVisibleStars] = useState(0);

	// Animated counts for score and correct answers
	const animatedScore = useCountUp(gameStats.score);
	const animatedCorrect = useCountUp(gameStats.correct);

	// Track if game history has been saved to prevent duplicate saves
	// Use a ref that tracks the last saved game state to detect new games
	const lastSavedGameRef = useRef<{ score: number; gameQuestionCount: number } | null>(null);

	// Animate stars appearing one by one
	useEffect(() => {
		if (grade.stars === 0) {
			setVisibleStars(0);
			return;
		}

		setVisibleStars(0);
		const timeouts: ReturnType<typeof setTimeout>[] = [];

		for (let i = 0; i < grade.stars; i++) {
			const delay = 300 + i * 200;
			const timeout = setTimeout(() => {
				setVisibleStars(i + 1);
				audioService.play(AudioKey.SUCCESS);
			}, delay);
			timeouts.push(timeout);
		}

		return () => {
			timeouts.forEach(timeout => clearTimeout(timeout));
		};
	}, [grade.stars]);

	// Save game history on mount (only once per game)
	useEffect(() => {
		if (!gameState) {
			logger.gameInfo('No game state found, redirecting to home');
			navigate(ROUTES.HOME);
			return;
		}

		// Only save if user is authenticated
		if (!currentUser?.id) {
			logger.gameInfo('User not authenticated, skipping game history save');
			return;
		}

		// Check if this game has already been saved by comparing with last saved game
		const currentGameKey = {
			score: gameState.score,
			gameQuestionCount: gameState.gameQuestionCount,
		};
		const lastSaved = lastSavedGameRef.current;
		if (
			lastSaved &&
			lastSaved.score === currentGameKey.score &&
			lastSaved.gameQuestionCount === currentGameKey.gameQuestionCount
		) {
			return;
		}

		// Mark as saved immediately to prevent race conditions
		lastSavedGameRef.current = currentGameKey;

		// Save to history
		// DifficultyLevel.MEDIUM is already GameDifficulty (DifficultyLevel is part of GameDifficulty union)
		// Use isGameDifficulty type guard to ensure type safety
		const difficulty: GameDifficulty =
			gameState.difficulty && isGameDifficulty(gameState.difficulty) ? gameState.difficulty : DifficultyLevel.MEDIUM;
		const gameData: GameData = {
			userId: currentUser.id,
			score: gameState.score,
			gameQuestionCount: gameState.gameQuestionCount,
			correctAnswers: gameState.correctAnswers,
			topic: gameState.topic || 'General',
			difficulty,
			gameMode: currentGameMode || GameMode.QUESTION_LIMITED,
			timeSpent: gameState.timeSpent,
			creditsUsed: 0,
			questionsData: gameState.questionsData,
		};

		// Double-check before calling mutate to prevent duplicate saves
		// This is a safety check in case the useEffect runs again before the mutation completes
		if (
			lastSavedGameRef.current &&
			lastSavedGameRef.current.score === currentGameKey.score &&
			lastSavedGameRef.current.gameQuestionCount === currentGameKey.gameQuestionCount
		) {
			return;
		}

		saveHistoryMutation.mutate(gameData, {
			onSuccess: () => {
				logger.gameInfo('Game saved to history', {
					score: gameState.score,
					correctAnswers: gameState.correctAnswers,
				});
			},
			onError: error => {
				// Reset flag on error to allow retry
				lastSavedGameRef.current = null;
				logger.gameError('Failed to save game to history', { error: String(error) });
			},
		});
	}, [gameState, currentGameMode, currentUser?.id, navigate, saveHistoryMutation]);

	const handleGoHome = () => {
		audioService.play(AudioKey.BUTTON_CLICK);
		navigate(ROUTES.HOME);
	};

	// Redirect if no game state
	if (!gameState) {
		return null;
	}

	return (
		<motion.main
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className='min-h-screen py-12 px-4'
		>
			<div className='max-w-2xl mx-auto'>
				<Card className='p-8 text-center space-y-8'>
					{/* Header */}
					<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
						<Trophy className='w-24 h-24 text-primary mx-auto mb-4' />
						<h1 className='text-4xl font-bold mb-2'>Game Complete!</h1>
						<p className='text-muted-foreground'>
							{gameStats.topic} - {gameStats.difficulty}
						</p>
						{analytics?.game?.mostPlayedTopic &&
							analytics.game.mostPlayedTopic !== 'None' &&
							gameStats.topic === analytics.game.mostPlayedTopic && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3 }}
									className='mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg'
								>
									<div className='flex items-center gap-3 justify-center'>
										<BookOpen className='h-5 w-5 text-indigo-500' />
										<p className='text-sm font-medium text-indigo-500'>🎯 This is your most played topic!</p>
									</div>
								</motion.div>
							)}
					</motion.div>

					{/* Grade - Stars */}
					<motion.div
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.3 }}
					>
						<div className='flex justify-center items-center gap-4 mb-4'>
							{[0, 1, 2].map(index => (
								<motion.div
									key={index}
									initial={{ opacity: 0, scale: 0, rotate: -180 }}
									animate={
										index < visibleStars ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0.3, scale: 0.5, rotate: 0 }
									}
									transition={{
										type: 'spring',
										stiffness: 200,
										damping: 15,
									}}
								>
									<Star
										className={cn('w-16 h-16 fill-current', index < visibleStars ? 'text-yellow-500' : 'text-gray-400')}
									/>
								</motion.div>
							))}
						</div>
						<div className='text-2xl text-muted-foreground mt-2'>{gameStats.percentage}% Correct</div>
					</motion.div>

					{/* Stats Grid */}
					<div className='grid grid-cols-3 gap-6'>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
							className='space-y-2'
						>
							<Trophy className='w-8 h-8 text-primary mx-auto' />
							<div className='text-3xl font-bold text-primary'>{animatedScore.toLocaleString()}</div>
							<div className='text-sm text-muted-foreground'>Total Score</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.5 }}
							className='space-y-2'
						>
							<Target className='w-8 h-8 text-primary mx-auto' />
							<div className='text-3xl font-bold text-primary'>
								{animatedCorrect}/{gameStats.total}
							</div>
							<div className='text-sm text-muted-foreground'>Correct Answers</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.6 }}
							className='space-y-2'
						>
							<Clock className='w-8 h-8 text-primary mx-auto' />
							<div className='text-3xl font-bold text-primary'>{gameStats.time}</div>
							<div className='text-sm text-muted-foreground'>Time Taken</div>
						</motion.div>
					</div>

					{/* Questions Breakdown */}
					{gameStats.questionsData.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.7 }}
							className='text-left'
						>
							<h3 className='text-lg font-semibold mb-4'>Question Breakdown</h3>
							<div className='space-y-3 max-h-64 overflow-y-auto'>
								{gameStats.questionsData.map((q, index) => (
									<div
										key={index}
										className={cn(
											'p-3 rounded-lg border-2 border-white',
											q.isCorrect ? 'bg-green-500/30 ring-2 ring-green-500/50' : 'bg-red-500/30 ring-2 ring-red-500/50'
										)}
									>
										<div className='flex items-start gap-2'>
											{q.isCorrect ? (
												<CheckCircle2 className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' />
											) : (
												<XCircle className='w-5 h-5 text-red-500 flex-shrink-0 mt-0.5' />
											)}
											<div className='flex-1 min-w-0'>
												<p className='text-sm font-medium truncate'>{q.question}</p>
												{!q.isCorrect && (
													<p className='text-xs text-muted-foreground mt-1'>Correct: {q.correctAnswer}</p>
												)}
											</div>
											<span className='text-xs text-muted-foreground'>{q.timeSpent}s</span>
										</div>
									</div>
								))}
							</div>
						</motion.div>
					)}

					{/* Social Share */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.75 }}
						className='flex justify-center'
					>
						<SocialShare
							score={gameStats.correct}
							total={gameStats.total}
							topic={gameStats.topic}
							difficulty={gameStats.difficulty}
						/>
					</motion.div>

					{/* Action Buttons */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.8 }}
						className='flex gap-4 justify-center'
					>
						<Button size={ButtonSize.LG} onClick={handleGoHome}>
							Back to Home
						</Button>
					</motion.div>
				</Card>
			</div>
		</motion.main>
	);
}
