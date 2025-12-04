/**
 * Game Summary View
 *
 * @module GameSummaryView
 * @description Displays game completion summary with score, statistics, and question breakdown
 */
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Star, Target, Trophy, XCircle } from 'lucide-react';

import { DifficultyLevel, GameMode } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { GameData, GameDifficulty } from '@shared/types';
import { calculatePercentage } from '@shared/utils';

import { Button, Card, SocialShare } from '@/components';
import { AudioKey, ButtonSize } from '@/constants';
import { useAppSelector, useSaveHistory } from '@/hooks';
import { selectCurrentGameMode, selectCurrentUser } from '@/redux/selectors';
import { audioService } from '@/services';
import type { GameSummaryNavigationState, GameSummaryStats } from '@/types';
import { calculateGrade } from '@/utils';
import { formatTime } from '@/utils/format.utils';

export function GameSummaryView() {
	const navigate = useNavigate();
	const location = useLocation();
	const saveHistoryMutation = useSaveHistory();
	const currentGameMode = useAppSelector(selectCurrentGameMode);
	const currentUser = useAppSelector(selectCurrentUser);

	// Get game data from navigation state
	const gameState = location.state as GameSummaryNavigationState | null;

	const gameStats = useMemo((): GameSummaryStats => {
		if (!gameState) {
			return {
				score: 0,
				correct: 0,
				total: 0,
				time: '0:00',
				percentage: 0,
				topic: 'Unknown',
				difficulty: 'Unknown',
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
			difficulty: gameState.difficulty || 'Medium',
			questionsData: gameState.questionsData || [],
		};
	}, [gameState]);

	// Calculate grade with stars
	const grade = useMemo(() => {
		return calculateGrade(gameStats.percentage);
	}, [gameStats.percentage]);

	// Track which stars have appeared
	const [visibleStars, setVisibleStars] = useState(0);

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

	// Save game history on mount
	useEffect(() => {
		if (!gameState) {
			logger.gameInfo('No game state found, redirecting to home');
			navigate('/');
			return;
		}

		// Only save if user is authenticated
		if (!currentUser?.id) {
			logger.gameInfo('User not authenticated, skipping game history save');
			return;
		}

		// Save to history
		const gameData: GameData = {
			userId: currentUser.id,
			score: gameState.score,
			gameQuestionCount: gameState.gameQuestionCount,
			correctAnswers: gameState.correctAnswers,
			topic: gameState.topic || 'General',
			difficulty: (gameState.difficulty as GameDifficulty) || DifficultyLevel.MEDIUM,
			gameMode: currentGameMode || GameMode.QUESTION_LIMITED,
			timeSpent: gameState.timeSpent,
			creditsUsed: 0,
			questionsData: gameState.questionsData,
		};

		saveHistoryMutation.mutate(gameData, {
			onSuccess: () => {
				logger.gameInfo('Game saved to history', {
					score: gameState.score,
					correctAnswers: gameState.correctAnswers,
				});
			},
			onError: error => {
				logger.gameError('Failed to save game to history', { error: String(error) });
			},
		});
	}, [gameState, currentGameMode, currentUser, navigate, saveHistoryMutation]);

	const handleGoHome = () => {
		audioService.play(AudioKey.BUTTON_CLICK);
		navigate('/');
	};

	// Redirect if no game state
	if (!gameState) {
		return null;
	}

	return (
		<motion.main
			role='main'
			aria-label='Game Summary'
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
										className={`w-16 h-16 fill-current ${index < visibleStars ? 'text-yellow-500' : 'text-gray-400'}`}
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
							<div className='text-3xl font-bold text-primary'>{gameStats.score}</div>
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
								{gameStats.correct}/{gameStats.total}
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
										className={`p-3 rounded-lg border ${
											q.isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'
										}`}
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
