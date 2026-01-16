import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Clock, Star, Target, Trophy, XCircle } from 'lucide-react';

import { DifficultyLevel } from '@shared/constants';
import { calculatePercentage, hasQuestionAccess } from '@shared/utils';

import { AudioKey, TextColor } from '@/constants';
import { BackToHomeButton, Card, SocialShare } from '@/components';
import {
	useAppSelector,
	useCountUp,
	useCurrentUserData,
	useGameFinalization,
	useNavigationClose,
	useUserAnalytics,
} from '@/hooks';
import { audioService, clientLogger as logger } from '@/services';
import type { GameKey, GameSummaryStats } from '@/types';
import { cn, formatTime, getAnswerLetter } from '@/utils';
import {
	selectCorrectAnswers,
	selectCurrentDifficulty,
	selectCurrentTopic,
	selectGameId,
	selectGameQuestionCount,
	selectGameScore,
	selectQuestionsData,
	selectTimeSpent,
} from '@/redux/selectors';

export function GameSummaryView() {
	const { handleClose } = useNavigationClose();
	const { finalizeGameSession } = useGameFinalization();
	const currentTopic = useAppSelector(selectCurrentTopic);
	const currentDifficulty = useAppSelector(selectCurrentDifficulty);
	const score = useAppSelector(selectGameScore);
	const correctAnswers = useAppSelector(selectCorrectAnswers);
	const gameQuestionCount = useAppSelector(selectGameQuestionCount);
	const timeSpent = useAppSelector(selectTimeSpent);
	const questionsData = useAppSelector(selectQuestionsData);
	const currentUser = useCurrentUserData();
	const { data: analytics } = useUserAnalytics();

	// Get game data from Redux
	const gameStats = useMemo((): GameSummaryStats => {
		const total = gameQuestionCount ?? 0;
		const time = formatTime(timeSpent);
		const percentage = calculatePercentage(correctAnswers, total);

		return {
			score,
			correct: correctAnswers,
			total,
			time,
			percentage,
			topic: currentTopic ?? 'General',
			difficulty: currentDifficulty ?? DifficultyLevel.MEDIUM,
			questionsData: questionsData ?? [],
		};
	}, [score, correctAnswers, gameQuestionCount, timeSpent, currentTopic, currentDifficulty, questionsData]);

	// Calculate grade with stars
	const grade = useMemo(() => {
		const percentage = gameStats.percentage;
		if (percentage >= 90) return { stars: 3, color: TextColor.GREEN_500 };
		if (percentage >= 80) return { stars: 2, color: TextColor.BLUE_500 };
		if (percentage >= 70) return { stars: 1, color: TextColor.YELLOW_500 };
		return { stars: 0, color: TextColor.RED_500 };
	}, [gameStats.percentage]);

	// Track which stars have appeared
	const [visibleStars, setVisibleStars] = useState(0);

	// Animated counts for score and correct answers
	const animatedScore = useCountUp(gameStats.score);
	const animatedCorrect = useCountUp(gameStats.correct);

	// Track if game has been finalized to prevent duplicate finalization
	// Use a ref that tracks the last finalized game state to detect new games
	const lastFinalizedGameRef = useRef<GameKey | null>(null);

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

	// Get gameId from Redux
	const gameId = useAppSelector(selectGameId);

	// Finalize game session on mount (idempotent - safe to call multiple times)
	useEffect(() => {
		// Check if we have valid game data from Redux
		if (!gameId || score === 0 || gameQuestionCount === 0) {
			logger.gameInfo('No game state found in Redux, redirecting to home');
			handleClose();
			return;
		}

		// Only finalize if user is authenticated
		if (!currentUser?.id) {
			logger.gameInfo('User not authenticated, skipping game session finalization');
			return;
		}

		const currentGameKey = {
			score,
			gameQuestionCount: gameQuestionCount ?? 0,
		};

		// If the game has already been finalized, skip finalization again
		const lastFinalized = lastFinalizedGameRef.current;
		if (
			lastFinalized &&
			lastFinalized.score === currentGameKey.score &&
			lastFinalized.gameQuestionCount === currentGameKey.gameQuestionCount
		) {
			return;
		}

		// Mark as finalized immediately to prevent duplicate finalization
		lastFinalizedGameRef.current = currentGameKey;

		// Finalize game session (idempotent - safe to call even if already finalized)
		finalizeGameSession({
			navigateToSummary: false, // Already on summary page
			trackAnalytics: true,
			onError: error => {
				// Reset flag on error to allow retry
				lastFinalizedGameRef.current = null;
				logger.gameError('Failed to finalize game session', { errorInfo: { message: String(error) } });
			},
		});
	}, [gameId, score, gameQuestionCount, currentUser?.id, finalizeGameSession, handleClose]);

	// Redirect if no game state
	if (!gameId || score === 0) {
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
													<p className='text-xs text-muted-foreground mt-1'>
														Correct:{' '}
														{hasQuestionAccess(q)
															? `Answer ${getAnswerLetter(q.correctAnswerIndex)}`
															: q.correctAnswerText}
													</p>
												)}
											</div>
											<span className='text-xs text-muted-foreground'>{q.timeSpent ?? 'N/A'}s</span>
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
						<BackToHomeButton />
					</motion.div>
				</Card>
			</div>
		</motion.main>
	);
}
