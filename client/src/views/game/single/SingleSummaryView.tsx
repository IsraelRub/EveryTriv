import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, Clock, RotateCcw, Star, Tag, Trophy, XCircle } from 'lucide-react';

import { DEFAULT_GAME_CONFIG, DifficultyLevel, TIME_PERIODS_MS } from '@shared/constants';
import {
	calculatePercentage,
	calculateScoreRate,
	formatDifficulty,
	formatTitle,
	getErrorMessage,
	namesMatch,
} from '@shared/utils';

import {
	ANIMATION_CONFIG,
	ANIMATION_DELAYS,
	AudioKey,
	ButtonSize,
	Colors,
	ROUTES,
	SPRING_CONFIGS,
	STAR_GRADE_LEVELS_AND_THRESHOLDS,
	TRANSITION_DURATIONS,
	VariantBase,
} from '@/constants';
import { Button, Card, HomeButton, SocialShare } from '@/components';
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
import { cn, formatTime } from '@/utils';
import {
	selectAnswerHistory,
	selectCorrectAnswers,
	selectCurrentDifficulty,
	selectCurrentTopic,
	selectGameId,
	selectGameQuestionCount,
	selectGameScore,
	selectTimeSpent,
} from '@/redux/selectors';

export function SingleSummaryView() {
	const navigate = useNavigate();
	const { gameId: urlGameId } = useParams<{ gameId: string }>();
	const { handleClose } = useNavigationClose();
	const { finalizeGameSession } = useGameFinalization();
	const currentTopic = useAppSelector(selectCurrentTopic);
	const currentDifficulty = useAppSelector(selectCurrentDifficulty);
	const score = useAppSelector(selectGameScore);
	const correctAnswers = useAppSelector(selectCorrectAnswers);
	const gameQuestionCount = useAppSelector(selectGameQuestionCount);
	const timeSpent = useAppSelector(selectTimeSpent);
	const answerHistory = useAppSelector(selectAnswerHistory);
	const currentUser = useCurrentUserData();
	const { data: analytics } = useUserAnalytics();

	// Get game data from Redux
	const gameStats = useMemo((): GameSummaryStats => {
		const total = gameQuestionCount ?? 0;
		// Round so e.g. 59.9s displays as 01:00 when the user played a full minute (e.g. time-limited timeout)
		const time = formatTime(Math.round(timeSpent));
		const percentage = calculatePercentage(correctAnswers, total);

		return {
			score,
			correct: correctAnswers,
			total,
			time,
			percentage,
			topic: currentTopic ?? DEFAULT_GAME_CONFIG.defaultTopic,
			difficulty: currentDifficulty ?? DifficultyLevel.MEDIUM,
			answerHistory: answerHistory ?? [],
		};
	}, [score, correctAnswers, gameQuestionCount, timeSpent, currentTopic, currentDifficulty, answerHistory]);

	// Stars: use the better of score-based rate and accuracy-based rate so e.g. 11/23 correct (48%) isn't under-rewarded when score rate is lower (e.g. time-limited).
	const scoreRate = calculateScoreRate(gameStats.score, gameStats.total);
	const accuracyRate = gameStats.total > 0 ? (100 * gameStats.correct) / gameStats.total : 0;
	const effectiveRate = Math.max(scoreRate, accuracyRate);
	const starsCount =
		Object.values(STAR_GRADE_LEVELS_AND_THRESHOLDS).find(({ threshold }) => effectiveRate >= threshold)?.stars ?? 0;

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
		setVisibleStars(0);
		if (starsCount === 0) return;

		const timeouts: ReturnType<typeof setTimeout>[] = [];

		for (let i = 0; i < starsCount; i++) {
			const delay = TIME_PERIODS_MS.THREE_HUNDRED_MILLISECONDS + i * TIME_PERIODS_MS.TWO_HUNDRED_MILLISECONDS;
			const timeout = setTimeout(() => {
				setVisibleStars(i + 1);
				audioService.play(AudioKey.SUCCESS);
			}, delay);
			timeouts.push(timeout);
		}

		return () => {
			timeouts.forEach(timeout => clearTimeout(timeout));
		};
	}, [starsCount]);

	// Prefer gameId from URL (summary/:gameId) so finalize uses the session we navigated to; fallback to Redux for redirect check
	const reduxGameId = useAppSelector(selectGameId);
	const gameId = urlGameId ?? reduxGameId;

	// Finalize game session on mount (idempotent - safe to call multiple times)
	useEffect(() => {
		// Require URL gameId so we finalize the correct session; require Redux game state for stats
		if (!urlGameId) {
			logger.gameInfo('No gameId in URL, redirecting to home');
			handleClose();
			return;
		}
		if (!gameQuestionCount || gameQuestionCount === 0) {
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

		// Finalize using URL gameId so we finalize the session this page belongs to (avoids Redux/URL mismatch)
		finalizeGameSession({
			navigateToSummary: false, // Already on summary page
			trackAnalytics: true,
			gameId: urlGameId,
			onError: error => {
				// Reset flag on error to allow retry
				lastFinalizedGameRef.current = null;
				logger.gameError('Failed to finalize game session', { errorInfo: { message: getErrorMessage(error) } });
			},
		});
	}, [urlGameId, score, gameQuestionCount, currentUser?.id, finalizeGameSession, handleClose]);

	const handlePlayAgain = useCallback(() => {
		navigate(ROUTES.GAME_SINGLE);
	}, [navigate]);

	// Redirect if no game state
	// Note: score can be 0 if user answered incorrectly - that's valid
	if (!gameId || !gameQuestionCount || gameQuestionCount === 0) {
		return null;
	}

	return (
		<motion.main
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: TRANSITION_DURATIONS.SMOOTH, ease: ANIMATION_CONFIG.EASING_NAMES.EASE_OUT }}
			className='view-main'
		>
			<div className='view-centered-2xl h-full flex flex-col'>
				<Card className='card-padding text-center view-spacing-lg flex-1 flex flex-col overflow-y-auto'>
					{/* Header */}
					<div>
						{/* Game Complete Title - Dramatic Entrance */}
						<motion.h1
							initial={{ opacity: 0, scale: 2.5, rotate: -10, filter: 'blur(10px)' }}
							animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }}
							transition={{
								delay: ANIMATION_DELAYS.STAGGER_NORMAL,
								...SPRING_CONFIGS.BOUNCY,
							}}
							className='text-4xl md:text-5xl font-extrabold mb-2 md:mb-4 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent tracking-wider'
						>
							Game Over!
						</motion.h1>
						<motion.div
							initial={{ scale: 0, rotate: -90 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ delay: ANIMATION_DELAYS.SEQUENCE_MEDIUM, ...SPRING_CONFIGS.GENTLE }}
						>
							<Trophy className='w-16 md:w-20 lg:w-24 h-16 md:h-20 lg:h-24 text-primary mx-auto mb-2 md:mb-4' />
						</motion.div>
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{
								delay:
									ANIMATION_DELAYS.SEQUENCE_STEP + ANIMATION_DELAYS.SEQUENCE_STEP + ANIMATION_DELAYS.SEQUENCE_LARGE,
							}}
							className='text-muted-foreground'
						>
							{formatTitle(gameStats.topic)} - {formatDifficulty(gameStats.difficulty)}
						</motion.p>
						{analytics?.game?.mostPlayedTopic &&
							analytics.game.mostPlayedTopic !== 'None' &&
							namesMatch(gameStats.topic, analytics.game.mostPlayedTopic) && (
								<motion.div
									initial={{ opacity: 0, scale: 0.9, y: 10 }}
									animate={{ opacity: 1, scale: 1, y: 0 }}
									transition={{
										delay: ANIMATION_DELAYS.SEQUENCE_MEDIUM + ANIMATION_DELAYS.SEQUENCE_LARGE,
										...SPRING_CONFIGS.BOUNCY,
									}}
									className='mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20'
								>
									<div className='flex items-center gap-3 justify-center'>
										<Tag className='h-5 w-5 text-indigo-500' />
										<p className='text-sm font-medium text-indigo-500'> This is your most played topic!</p>
									</div>
								</motion.div>
							)}
					</div>

					{/* Grade - Stars */}
					<motion.div
						initial={{ opacity: 0, scale: 0.8, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{
							delay:
								ANIMATION_DELAYS.SEQUENCE_STEP + ANIMATION_DELAYS.SEQUENCE_MEDIUM + ANIMATION_DELAYS.SEQUENCE_LARGE,
							...SPRING_CONFIGS.GENTLE,
						}}
					>
						<div className='flex justify-center items-center gap-4 mb-4'>
							{[0, 1, 2].map(index => (
								<motion.div
									key={index}
									initial={{ opacity: 0, scale: 0 }}
									animate={index < visibleStars ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 0.5 }}
									transition={SPRING_CONFIGS.ICON_SPRING}
								>
									<Star
										className={cn(
											'w-16 h-16 fill-current',
											index < visibleStars ? Colors.YELLOW_500.text : Colors.GRAY_400.text
										)}
									/>
								</motion.div>
							))}
						</div>
						<div className='text-2xl text-muted-foreground mt-2'>{gameStats.percentage}% Correct</div>
					</motion.div>

					{/* Stats Grid */}
					<div className='grid grid-cols-3 gap-6'>
						<motion.div
							initial={{ opacity: 0, y: 20, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{
								delay: ANIMATION_DELAYS.SEQUENCE_LARGE + ANIMATION_DELAYS.SEQUENCE_LARGE,
								...SPRING_CONFIGS.GENTLE,
							}}
							className='space-y-2'
						>
							<Trophy className='w-8 h-8 text-primary mx-auto' />
							<div className='text-3xl font-bold text-primary'>{animatedScore.toLocaleString()}</div>
							<div className='text-sm text-muted-foreground'>Total Score</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{
								delay:
									ANIMATION_DELAYS.SEQUENCE_STEP + ANIMATION_DELAYS.SEQUENCE_LARGE + ANIMATION_DELAYS.SEQUENCE_LARGE,
								...SPRING_CONFIGS.GENTLE,
							}}
							className='space-y-2'
						>
							<Brain className='w-8 h-8 text-primary mx-auto' />
							<div className='text-3xl font-bold text-primary'>
								{animatedCorrect}/{gameStats.total}
							</div>
							<div className='text-sm text-muted-foreground'>Correct Answers</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{
								delay:
									ANIMATION_DELAYS.SEQUENCE_MEDIUM + ANIMATION_DELAYS.SEQUENCE_LARGE + ANIMATION_DELAYS.SEQUENCE_LARGE,
								...SPRING_CONFIGS.GENTLE,
							}}
							className='space-y-2'
						>
							<Clock className='w-8 h-8 text-primary mx-auto' />
							<div className='text-3xl font-bold text-primary'>{gameStats.time}</div>
							<div className='text-sm text-muted-foreground'>Time Taken</div>
						</motion.div>
					</div>

					{/* Questions Breakdown */}
					{gameStats.answerHistory.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{
								delay:
									ANIMATION_DELAYS.STAGGER_NORMAL +
									ANIMATION_DELAYS.SEQUENCE_STEP +
									ANIMATION_DELAYS.SEQUENCE_LARGE +
									ANIMATION_DELAYS.SEQUENCE_LARGE,
								...SPRING_CONFIGS.GENTLE,
							}}
							className='text-left'
						>
							<h3 className='text-lg font-semibold mb-4'>Question Breakdown</h3>
							<div className='space-y-3 max-h-64 overflow-y-auto'>
								{gameStats.answerHistory.map((q, index) => (
									<div
										key={index}
										className={cn(
											'p-3 rounded-lg border-2',
											q.isCorrect ? 'bg-green-500/25 border-green-500/50' : 'bg-red-500/25 border-red-500/50'
										)}
									>
										<div className='flex items-start gap-2'>
											{q.isCorrect ? (
												<CheckCircle2 className={cn('w-5 h-5 flex-shrink-0 mt-0.5', Colors.GREEN_500.text)} />
											) : (
												<XCircle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', Colors.RED_500.text)} />
											)}
											<div className='flex-1 min-w-0'>
												<p className='text-sm font-medium line-clamp-2 break-words'>{q.question}</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</motion.div>
					)}

					{/* Play Again + Social Share (same row) */}
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{
							delay:
								ANIMATION_DELAYS.SEQUENCE_MEDIUM +
								ANIMATION_DELAYS.SEQUENCE_STEP +
								ANIMATION_DELAYS.SEQUENCE_LARGE +
								ANIMATION_DELAYS.SEQUENCE_LARGE,
							...SPRING_CONFIGS.GENTLE,
						}}
						className='flex flex-wrap items-center justify-center gap-4'
					>
						<Button variant={VariantBase.DEFAULT} size={ButtonSize.LG} onClick={handlePlayAgain}>
							<RotateCcw className='h-4 w-4 mr-2' />
							Play Again
						</Button>
						{gameStats.total > 0 && (
							<SocialShare
								score={gameStats.correct}
								total={gameStats.total}
								topic={gameStats.topic}
								difficulty={gameStats.difficulty}
							/>
						)}
					</motion.div>

					{/* Home (centered, row below) */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							delay:
								ANIMATION_DELAYS.SEQUENCE_LARGE +
								ANIMATION_DELAYS.SEQUENCE_STEP +
								ANIMATION_DELAYS.SEQUENCE_LARGE +
								ANIMATION_DELAYS.SEQUENCE_LARGE,
							...SPRING_CONFIGS.GENTLE,
						}}
						className='flex justify-center'
					>
						<HomeButton />
					</motion.div>
				</Card>
			</div>
		</motion.main>
	);
}
