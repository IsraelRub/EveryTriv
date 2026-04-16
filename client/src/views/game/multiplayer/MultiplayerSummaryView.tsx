import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileQuestion, Gauge, Hash, PartyPopper, Tag, Trophy, Users } from 'lucide-react';

import { APP_NAME, DEFAULT_GAME_CONFIG } from '@shared/constants';
import type { Player } from '@shared/types';
import { calculatePercentage, formatTitle, getDisplayNameFromUserFields, isRecord } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import {
	ANIMATION_DELAYS,
	AvatarSize,
	AvatarVariant,
	GameKey,
	getMultiplayerSummaryStorageKey,
	MultiplayerSummaryPayloadKey,
	PODIUM_SLOTS,
	ROUTES,
	SEMANTIC_ICON_TEXT,
	SocialShareMode,
	SPRING_CONFIGS,
} from '@/constants';
import type { MultiplayerAnswerBreakdownEntry } from '@/types';
import { queryInvalidationService } from '@/services';
import { cn, getDifficultyDisplayLabel } from '@/utils';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	QuestionBreakdown,
	StatCard,
	SummaryActionButtons,
	UserAvatar,
} from '@/components';
import { useAppSelector, useCurrentUserData, useMultiplayer } from '@/hooks';
import { selectMultiplayerPersonalAnswerHistory } from '@/redux/selectors';

function isPlayerLike(value: unknown): value is Player {
	if (!isRecord(value)) return false;
	return (
		VALIDATORS.string(value.userId) && VALIDATORS.number(value.score) && VALIDATORS.number(value.correctAnswers ?? 0)
	);
}

function isBreakdownEntry(value: unknown): value is MultiplayerAnswerBreakdownEntry {
	return (
		isRecord(value) &&
		VALIDATORS.string(value.question) &&
		typeof value.isCorrect === 'boolean' &&
		(value.questionId === undefined || VALIDATORS.string(value.questionId)) &&
		(value.correctAnswerText === undefined || VALIDATORS.string(value.correctAnswerText)) &&
		(value.userAnswerText === undefined || VALIDATORS.string(value.userAnswerText))
	);
}

function parsePersistedSummary(roomId: string): {
	leaderboard: Player[];
	questionCount: number | null;
	personalAnswerHistory: MultiplayerAnswerBreakdownEntry[];
} {
	try {
		const key = getMultiplayerSummaryStorageKey(roomId);
		const raw = sessionStorage.getItem(key);
		if (!raw) return { leaderboard: [], questionCount: null, personalAnswerHistory: [] };
		const parsed: unknown = JSON.parse(raw);
		let leaderboard: Player[] = [];
		let questionCount: number | null = null;
		let personalAnswerHistory: MultiplayerAnswerBreakdownEntry[] = [];
		if (isRecord(parsed) && MultiplayerSummaryPayloadKey.Leaderboard in parsed) {
			const arr = parsed[MultiplayerSummaryPayloadKey.Leaderboard];
			if (Array.isArray(arr) && arr.length > 0 && arr.every(isPlayerLike)) leaderboard = arr;
			if (VALIDATORS.number(parsed[MultiplayerSummaryPayloadKey.QuestionCount]))
				questionCount = parsed[MultiplayerSummaryPayloadKey.QuestionCount];
			const history = parsed[MultiplayerSummaryPayloadKey.PersonalAnswerHistory];
			if (Array.isArray(history) && history.every(isBreakdownEntry)) personalAnswerHistory = history;
			return { leaderboard, questionCount, personalAnswerHistory };
		}
		if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isPlayerLike))
			return { leaderboard: parsed, questionCount: null, personalAnswerHistory: [] };
		return { leaderboard: [], questionCount: null, personalAnswerHistory: [] };
	} catch {
		return { leaderboard: [], questionCount: null, personalAnswerHistory: [] };
	}
}

export function MultiplayerSummaryView() {
	const { t } = useTranslation();
	const { roomId } = useParams<{ roomId: string }>();

	const { leaderboard, room, disconnect } = useMultiplayer();
	const currentUser = useCurrentUserData();

	const persistedSummary = useMemo(
		() =>
			roomId
				? parsePersistedSummary(roomId)
				: {
						leaderboard: [],
						questionCount: null,
						personalAnswerHistory: [] satisfies MultiplayerAnswerBreakdownEntry[],
					},
		[roomId]
	);

	const reduxPersonalHistory = useAppSelector(selectMultiplayerPersonalAnswerHistory);
	const personalAnswerHistory = useMemo(() => {
		if (reduxPersonalHistory.length > 0) return reduxPersonalHistory;
		return persistedSummary.personalAnswerHistory;
	}, [reduxPersonalHistory, persistedSummary.personalAnswerHistory]);

	const results = useMemo(() => {
		if (leaderboard.length > 0) return leaderboard;
		if (persistedSummary.leaderboard.length > 0) return persistedSummary.leaderboard;
		return [];
	}, [leaderboard, persistedSummary.leaderboard]);

	const { winner, isWinner } = useMemo((): { winner: Player | null; isWinner: boolean } => {
		const first = results[0];
		if (!first || results.length === 0) return { winner: null, isWinner: false };
		const topScore = first.score;
		const tiedCount = results.filter(p => p.score === topScore).length;
		const hasSingleWinner = tiedCount === 1;
		const winner: Player | null = hasSingleWinner ? first : null;
		return {
			winner,
			isWinner: winner !== null && winner.userId === currentUser?.id,
		};
	}, [results, currentUser?.id]);

	const clearPersistedSummary = useCallback(() => {
		if (roomId) {
			try {
				sessionStorage.removeItem(getMultiplayerSummaryStorageKey(roomId));
			} catch {
				// Ignore
			}
		}
	}, [roomId]);

	const onBeforeNavigate = useCallback(() => {
		clearPersistedSummary();
		disconnect();
	}, [clearPersistedSummary, disconnect]);

	const queryClient = useQueryClient();

	useEffect(() => {
		return () => {
			clearPersistedSummary();
			disconnect();
		};
	}, [disconnect, clearPersistedSummary]);

	useEffect(() => {
		if (results.length > 0 && currentUser?.id) {
			void queryInvalidationService.invalidateAfterGameComplete(queryClient, currentUser.id);
		}
	}, [queryClient, results.length, currentUser?.id]);

	const myResult = useMemo(() => results.find(r => r.userId === currentUser?.id), [results, currentUser?.id]);
	const shareScore = myResult?.correctAnswers ?? 0;
	const shareTotal = room?.questions?.length ?? persistedSummary.questionCount ?? 0;
	const shareTopic = formatTitle(room?.config?.topic ?? DEFAULT_GAME_CONFIG.defaultTopic);
	const shareDifficulty = room?.config?.difficulty;
	const sharePercentage = calculatePercentage(shareScore, shareTotal);
	const shareInterpolation = {
		appName: APP_NAME,
		topic: shareTopic,
		difficulty: getDifficultyDisplayLabel(shareDifficulty, t),
		score: shareScore,
		total: shareTotal,
		percentage: sharePercentage,
		points: myResult?.score ?? 0,
	};
	const multiplayerShareText =
		shareTotal > 0
			? isWinner
				? t(GameKey.SHARE_MULTIPLAYER_FULL_WON, shareInterpolation)
				: t(GameKey.SHARE_MULTIPLAYER_FULL_SCORED, shareInterpolation)
			: isWinner
				? t(GameKey.SHARE_MULTIPLAYER_SHORT_WON, shareInterpolation)
				: t(GameKey.SHARE_MULTIPLAYER_SHORT_SCORED, shareInterpolation);

	return (
		<main className='view-main animate-fade-in-scale-simple'>
			<div className='view-content-3xl-scroll'>
				{/* Winner Announcement */}
				<div className='text-center flex-shrink-0 mb-8'>
					{isWinner && (
						<motion.div
							initial={{ scale: 0, rotate: -90 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={SPRING_CONFIGS.GENTLE}
						>
							<Trophy
								className={cn(
									'w-16 md:w-20 lg:w-24 h-16 md:h-20 lg:h-24 mx-auto mb-2 md:mb-4',
									SEMANTIC_ICON_TEXT.warning
								)}
							/>
						</motion.div>
					)}
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: ANIMATION_DELAYS.SEQUENCE_MEDIUM }}
						className='text-3xl md:text-4xl font-bold mb-1 md:mb-2 flex items-center justify-center gap-4'
					>
						{isWinner ? (
							<>
								<PartyPopper className={cn('w-8 h-8 md:w-10 md:h-10', SEMANTIC_ICON_TEXT.warning)} />
								{t(GameKey.YOU_WON)}
							</>
						) : (
							t(GameKey.GAME_OVER)
						)}
					</motion.h1>
					{winner && (
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: ANIMATION_DELAYS.SEQUENCE_LARGE }}
							className='text-xl text-muted-foreground'
						>
							{t(GameKey.WINNER)} <span className='font-bold text-primary'>{getDisplayNameFromUserFields(winner)}</span>{' '}
							{t(GameKey.WITH_POINTS, { count: winner.score })}
						</motion.p>
					)}
				</div>

				{/* Podium for top 2 or 3 */}
				{results.length >= 2 &&
					(() => {
						const slots = PODIUM_SLOTS.filter(s => s.rank <= results.length)
							.slice()
							.sort((a, b) => a.podiumSlotIndex - b.podiumSlotIndex);
						return (
							<div className='flex justify-center items-end gap-4 min-h-48'>
								{slots.map((slot, displayIndex) => {
									const player = results[slot.resultIndex];
									if (!player) return null;
									const Icon = slot.icon;
									return (
										<motion.div
											key={player.userId}
											initial={{ opacity: 0, y: 50 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{
												delay: ANIMATION_DELAYS.SEQUENCE_AFTER_HEADER + displayIndex * ANIMATION_DELAYS.STAGGER_LARGE,
											}}
											className='flex flex-col items-center'
										>
											<UserAvatar source={player} size={AvatarSize.LG} variant={AvatarVariant.ELEVATED} />
											<span className='text-sm font-medium mt-1 max-w-20 truncate'>
												{getDisplayNameFromUserFields(player)}
											</span>
											<span className='text-xs text-muted-foreground'>
												{player.score} {t(GameKey.PTS)}
											</span>
											<div
												className={cn(
													'w-20 rounded-t-lg flex items-center justify-center mt-2',
													slot.podiumHeight,
													slot.bgColor
												)}
											>
												<Icon className='h-8 w-8 text-white' />
											</div>
										</motion.div>
									);
								})}
							</div>
						);
					})()}

				{/* Full Results */}
				<Card>
					<CardHeader>
						<CardTitle>{t(GameKey.FINAL_STANDINGS)}</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						{results.length === 0 ? (
							<p className='text-center text-muted-foreground py-6'>{t(GameKey.NO_RESULTS_TO_DISPLAY)}</p>
						) : (
							results.map((player, index) => {
								const isCurrentUser = player.userId === currentUser?.id;

								return (
									<motion.div
										key={player.userId}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{
											delay: ANIMATION_DELAYS.MULTIPLAYER_STANDINGS_ROW_BASE + index * ANIMATION_DELAYS.STAGGER_NORMAL,
										}}
										className={cn(
											'flex items-center gap-4 p-4 rounded-lg',
											isCurrentUser ? 'bg-primary/30 ring-2 ring-primary/60' : 'bg-muted/50'
										)}
									>
										<span
											className={cn(
												'flex items-center gap-0.5 text-3xl font-bold w-12',
												index + 1 === 1 && SEMANTIC_ICON_TEXT.warning,
												index + 1 === 2 && SEMANTIC_ICON_TEXT.muted,
												index + 1 === 3 && 'text-orange-600',
												index + 1 > 3 && 'text-muted-foreground'
											)}
										>
											<Hash className='h-6 w-6 flex-shrink-0' />
											{index + 1}
										</span>
										<UserAvatar source={player} size={AvatarSize.MD} />
										<div className='flex-1'>
											<div className='font-semibold flex items-center gap-2'>
												{getDisplayNameFromUserFields(player)}
												{isCurrentUser && <span className='text-xs text-muted-foreground'>{t(GameKey.YOU)}</span>}
											</div>
											<div className='text-sm text-muted-foreground'>
												{player.correctAnswers ?? 0} {t(GameKey.CORRECT_ANSWERS_SUFFIX)}
											</div>
										</div>
										<div className='text-right'>
											<div className='text-2xl font-bold text-primary'>{player.score}</div>
											<div className='text-xs text-muted-foreground'>{t(GameKey.POINTS)}</div>
										</div>
									</motion.div>
								);
							})
						)}
					</CardContent>
				</Card>

				{/* Personal questions breakdown */}
				<QuestionBreakdown entries={personalAnswerHistory} />

				{/* Game Stats */}
				{room && (
					<Card>
						<CardHeader>
							<CardTitle>{t(GameKey.GAME_STATS)}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
								<StatCard
									icon={Users}
									label={t(GameKey.PLAYERS)}
									value={room.players?.length ?? 0}
									color={SEMANTIC_ICON_TEXT.primary}
								/>
								<StatCard
									icon={FileQuestion}
									label={t(GameKey.QUESTIONS_LABEL)}
									value={room.questions?.length ?? 0}
									color={SEMANTIC_ICON_TEXT.success}
								/>
								<StatCard
									icon={Gauge}
									label={t(GameKey.DIFFICULTY)}
									value={getDifficultyDisplayLabel(room.config?.difficulty, t)}
									color={SEMANTIC_ICON_TEXT.warning}
								/>
								<StatCard
									icon={Tag}
									label={t(GameKey.TOPIC)}
									value={formatTitle(room.config?.topic ?? DEFAULT_GAME_CONFIG.defaultTopic)}
									color={SEMANTIC_ICON_TEXT.secondary}
								/>
							</div>
						</CardContent>
					</Card>
				)}

				<SummaryActionButtons
					playAgainTo={ROUTES.MULTIPLAYER}
					onBeforeNavigate={onBeforeNavigate}
					share={
						results.length > 0
							? {
									score: shareScore,
									total: shareTotal > 0 ? shareTotal : 1,
									topic: shareTopic,
									difficulty: getDifficultyDisplayLabel(shareDifficulty, t),
									mode: SocialShareMode.MULTIPLAYER,
									shareText: multiplayerShareText,
								}
							: undefined
					}
				/>
			</div>
		</main>
	);
}
