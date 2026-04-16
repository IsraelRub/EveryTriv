import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleStar, Clock, CopyCheck, Star, Tag, Trophy } from 'lucide-react';

import { DEFAULT_GAME_CONFIG } from '@shared/constants';
import { calculatePercentage, calculateScoreRate, formatTitle, getErrorMessage, namesMatch } from '@shared/utils';

import {
	ANIMATION_CONFIG,
	ANIMATION_DELAYS,
	AudioKey,
	GameKey,
	ROUTES,
	SEMANTIC_ICON_TEXT,
	SINGLE_SUMMARY_STAR_SEQUENCE_MS,
	SocialShareMode,
	SPRING_CONFIGS,
	STAR_GRADE_LEVELS_AND_THRESHOLDS,
	TRANSITION_DURATIONS,
} from '@/constants';
import type { FinalizedGameSessionKey, GameSummaryStats } from '@/types';
import { audioService, clientLogger as logger } from '@/services';
import { cn, formatTime, getDifficultyDisplayLabel } from '@/utils';
import { Card, QuestionBreakdown, SummaryActionButtons } from '@/components';
import {
	useAppSelector,
	useCountUp,
	useCurrentUserData,
	useGameFinalization,
	useNavigationClose,
	useUserAnalytics,
} from '@/hooks';
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
	const { t } = useTranslation();
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
			difficulty: currentDifficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty,
			answerHistory: answerHistory ?? [],
		};
	}, [score, correctAnswers, gameQuestionCount, timeSpent, currentTopic, currentDifficulty, answerHistory]);

	// Stars: use the better of score-based rate and accuracy-based rate so e.g. 11/23 correct (48%) isn't under-rewarded when score rate is lower (e.g. time-limited).
	const scoreRate = calculateScoreRate(gameStats.score, gameStats.total);
	const effectiveRate = Math.max(scoreRate, gameStats.percentage);
	const starsCount =
		Object.values(STAR_GRADE_LEVELS_AND_THRESHOLDS).find(({ threshold }) => effectiveRate >= threshold)?.stars ?? 0;

	// Track which stars have appeared
	const [visibleStars, setVisibleStars] = useState(0);

	// Animated counts for score and correct answers
	const animatedScore = useCountUp(gameStats.score);
	const animatedCorrect = useCountUp(gameStats.correct);

	// Track if game has been finalized to prevent duplicate finalization
	// Use a ref that tracks the last finalized game state to detect new games
	const lastFinalizedGameRef = useRef<FinalizedGameSessionKey | null>(null);

	const {
		CONTAINER_DELAY_MS: starsContainerDelayMs,
		BEFORE_FIRST_STAR_MS: delayBeforeFirstStarMs,
		BETWEEN_STARS_MS: delayBetweenStarsMs,
	} = SINGLE_SUMMARY_STAR_SEQUENCE_MS;

	// Animate stars appearing one by one: after page/container visible, then first star, then second, then third
	useEffect(() => {
		setVisibleStars(0);
		if (starsCount === 0) return;

		const timeouts: ReturnType<typeof setTimeout>[] = [];

		for (let i = 0; i < starsCount; i++) {
			const delay = starsContainerDelayMs + delayBeforeFirstStarMs + i * delayBetweenStarsMs;
			const timeout = setTimeout(() => {
				setVisibleStars(i + 1);
				audioService.play(AudioKey.STAR_APPEAR);
			}, delay);
			timeouts.push(timeout);
		}

		return () => {
			timeouts.forEach(timeout => clearTimeout(timeout));
		};
	}, [starsCount, delayBeforeFirstStarMs, delayBetweenStarsMs, starsContainerDelayMs]);

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

		const sessionKey: FinalizedGameSessionKey = {
			score,
			gameQuestionCount: gameQuestionCount ?? 0,
		};

		// If the game has already been finalized, skip finalization again
		const lastFinalized = lastFinalizedGameRef.current;
		if (
			lastFinalized &&
			lastFinalized.score === sessionKey.score &&
			lastFinalized.gameQuestionCount === sessionKey.gameQuestionCount
		) {
			return;
		}

		// Mark as finalized immediately to prevent duplicate finalization
		lastFinalizedGameRef.current = sessionKey;

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
							{t(GameKey.GAME_OVER)}
						</motion.h1>
						<motion.div
							initial={{ scale: 0, rotate: -90 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ delay: ANIMATION_DELAYS.SEQUENCE_MEDIUM, ...SPRING_CONFIGS.GENTLE }}
						>
							<Trophy
								className={cn(
									'w-16 md:w-20 lg:w-24 h-16 md:h-20 lg:h-24 mx-auto mb-2 md:mb-4',
									SEMANTIC_ICON_TEXT.warning
								)}
							/>
						</motion.div>
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{
								delay: ANIMATION_DELAYS.SINGLE_SUMMARY_HEADER_TAIL,
							}}
							className='text-muted-foreground'
						>
							{formatTitle(gameStats.topic)} - {getDifficultyDisplayLabel(gameStats.difficulty, t)}
						</motion.p>
						{analytics?.game?.mostPlayedTopic && namesMatch(gameStats.topic, analytics.game.mostPlayedTopic) && (
							<motion.div
								initial={{ opacity: 0, scale: 0.9, y: 10 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								transition={{
									delay: ANIMATION_DELAYS.SINGLE_SUMMARY_HEADER_TAIL,
									...SPRING_CONFIGS.BOUNCY,
								}}
								className='mt-4'
							>
								<Card className='p-4 bg-indigo-500/10 border-indigo-500/20'>
									<div className='flex items-center gap-3 justify-center'>
										<Tag className='h-5 w-5 text-indigo-500' />
										<p className='text-sm font-medium text-indigo-500'>{t(GameKey.MOST_PLAYED_TOPIC_BADGE)}</p>
									</div>
								</Card>
							</motion.div>
						)}
					</div>

					{/* Grade - Stars */}
					<motion.div
						initial={{ opacity: 0, scale: 0.8, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{
							delay: ANIMATION_DELAYS.SEQUENCE_AFTER_HEADER,
							...SPRING_CONFIGS.GENTLE,
						}}
					>
						<div className='flex justify-center items-center gap-4 mb-4'>
							{[0, 1, 2].map(index => {
								const isEarnedSlot = index < starsCount;
								const isLit = isEarnedSlot && index < visibleStars;

								return (
									<motion.div
										key={`${index}-${isLit}`}
										initial={isLit ? { opacity: 1, scale: 1 } : false}
										animate={isLit ? { opacity: 1, scale: [1, 1.5, 1] } : { opacity: 0.35, scale: 1 }}
										transition={
											isLit
												? {
														duration: 0.55,
														times: [0, 0.32, 1],
														ease: ['easeOut', 'easeInOut'],
													}
												: { duration: 0.2 }
										}
									>
										<Star
											className={cn('w-16 h-16', isLit ? SEMANTIC_ICON_TEXT.warning : SEMANTIC_ICON_TEXT.muted)}
											fill='currentColor'
											strokeWidth={0}
										/>
									</motion.div>
								);
							})}
						</div>
						<div className='text-2xl text-muted-foreground mt-2'>
							{gameStats.percentage}% {t(GameKey.PERCENT_CORRECT)}
						</div>
					</motion.div>

					{/* Stats Grid */}
					<div className='grid grid-cols-3 gap-6'>
						{[
							{
								delay: ANIMATION_DELAYS.SEQUENCE_STATS_BASE,
								Icon: CircleStar,
								value: animatedScore.toLocaleString(),
								labelKey: GameKey.TOTAL_SCORE,
							},
							{
								delay: ANIMATION_DELAYS.SINGLE_SUMMARY_STATS_CORRECT,
								Icon: CopyCheck,
								value: `${animatedCorrect}/${gameStats.total}`,
								labelKey: GameKey.CORRECT_ANSWERS,
							},
							{
								delay: ANIMATION_DELAYS.SINGLE_SUMMARY_STATS_TIME,
								Icon: Clock,
								value: gameStats.time,
								labelKey: GameKey.TIME_TAKEN,
							},
						].map(({ delay, Icon, value, labelKey }) => (
							<motion.div
								key={labelKey}
								initial={{ opacity: 0, y: 20, scale: 0.9 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								transition={{
									delay,
									...SPRING_CONFIGS.GENTLE,
								}}
								className='space-y-2'
							>
								<Icon className='w-8 h-8 text-primary mx-auto' />
								<div className='text-3xl font-bold text-primary'>{value}</div>
								<div className='text-sm text-muted-foreground'>{t(labelKey)}</div>
							</motion.div>
						))}
					</div>

					{/* Questions Breakdown */}
					<QuestionBreakdown entries={gameStats.answerHistory} />

					{/* Play Again + Share (same row); Home (row below) */}
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{
							delay: ANIMATION_DELAYS.SINGLE_SUMMARY_ACTION_BUTTONS,
							...SPRING_CONFIGS.GENTLE,
						}}
					>
						<SummaryActionButtons
							playAgainTo={ROUTES.GAME_SINGLE}
							share={
								gameStats.total > 0
									? {
											score: gameStats.correct,
											total: gameStats.total,
											topic: gameStats.topic,
											difficulty: gameStats.difficulty,
											mode: SocialShareMode.SINGLE,
										}
									: undefined
							}
						/>
					</motion.div>
				</Card>
			</div>
		</motion.main>
	);
}
