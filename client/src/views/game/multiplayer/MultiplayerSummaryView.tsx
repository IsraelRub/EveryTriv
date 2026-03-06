import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileQuestion, Gauge, PartyPopper, RotateCcw, Tag, Trophy, Users } from 'lucide-react';

import { APP_NAME, DEFAULT_GAME_CONFIG } from '@shared/constants';
import type { Player } from '@shared/types';
import { calculatePercentage, formatDifficulty, formatTitle, isRecord } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import {
	ANIMATION_DELAYS,
	AvatarSize,
	ButtonSize,
	Colors,
	getMultiplayerSummaryStorageKey,
	PODIUM_SLOTS,
	ROUTES,
	SPRING_CONFIGS,
	VariantBase,
} from '@/constants';
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	HomeButton,
	SocialShare,
	StatCard,
	UserAvatar,
} from '@/components';
import { useCurrentUserData, useMultiplayer } from '@/hooks';
import { queryInvalidationService } from '@/services';
import { cn, getDisplayNameFromPlayer } from '@/utils';

function isPlayerLike(value: unknown): value is Player {
	if (!isRecord(value)) return false;
	return (
		VALIDATORS.string(value.userId) && VALIDATORS.number(value.score) && VALIDATORS.number(value.correctAnswers ?? 0)
	);
}

const MULTIPLAYER_SUMMARY_LEADERBOARD_KEY = 'leaderboard';
const MULTIPLAYER_SUMMARY_QUESTION_COUNT_KEY = 'questionCount';

function parsePersistedSummary(roomId: string): { leaderboard: Player[]; questionCount: number | null } {
	try {
		const key = getMultiplayerSummaryStorageKey(roomId);
		const raw = sessionStorage.getItem(key);
		if (!raw) return { leaderboard: [], questionCount: null };
		const parsed: unknown = JSON.parse(raw);
		if (isRecord(parsed) && MULTIPLAYER_SUMMARY_LEADERBOARD_KEY in parsed) {
			const arr = parsed[MULTIPLAYER_SUMMARY_LEADERBOARD_KEY];
			const count =
				typeof parsed[MULTIPLAYER_SUMMARY_QUESTION_COUNT_KEY] === 'number'
					? parsed[MULTIPLAYER_SUMMARY_QUESTION_COUNT_KEY]
					: null;
			if (!Array.isArray(arr) || arr.length === 0 || !arr.every(isPlayerLike))
				return { leaderboard: [], questionCount: null };
			return { leaderboard: arr, questionCount: count };
		}
		if (!Array.isArray(parsed) || parsed.length === 0) return { leaderboard: [], questionCount: null };
		if (!parsed.every(isPlayerLike)) return { leaderboard: [], questionCount: null };
		return { leaderboard: parsed, questionCount: null };
	} catch {
		return { leaderboard: [], questionCount: null };
	}
}

export function MultiplayerSummaryView() {
	const navigate = useNavigate();
	const { roomId } = useParams<{ roomId: string }>();

	const { leaderboard, room, disconnect } = useMultiplayer();
	const currentUser = useCurrentUserData();

	const persistedSummary = useMemo(
		() => (roomId ? parsePersistedSummary(roomId) : { leaderboard: [], questionCount: null }),
		[roomId]
	);

	const results = useMemo(() => {
		if (leaderboard.length > 0) return leaderboard;
		if (persistedSummary.leaderboard.length > 0) return persistedSummary.leaderboard;
		return [];
	}, [leaderboard, persistedSummary.leaderboard]);

	const winner = results[0];
	const isWinner = winner?.userId === currentUser?.id;

	const clearPersistedSummary = useCallback(() => {
		if (roomId) {
			try {
				sessionStorage.removeItem(getMultiplayerSummaryStorageKey(roomId));
			} catch {
				// Ignore
			}
		}
	}, [roomId]);

	const handlePlayAgain = useCallback(() => {
		clearPersistedSummary();
		disconnect();
		navigate(ROUTES.MULTIPLAYER);
	}, [clearPersistedSummary, disconnect, navigate]);

	const queryClient = useQueryClient();

	useEffect(() => {
		return () => {
			clearPersistedSummary();
			disconnect();
		};
	}, [disconnect, clearPersistedSummary]);

	useEffect(() => {
		if (results.length > 0 && currentUser?.id) {
			queryInvalidationService.invalidateAfterGameComplete(queryClient, currentUser.id);
		}
	}, [queryClient, results.length, currentUser?.id]);

	const myResult = useMemo(() => results.find(r => r.userId === currentUser?.id), [results, currentUser?.id]);
	const shareScore = myResult?.correctAnswers ?? 0;
	const shareTotal = room?.questions?.length ?? persistedSummary.questionCount ?? 0;
	const shareTopic = formatTitle(room?.config?.topic ?? DEFAULT_GAME_CONFIG.defaultTopic);
	const shareDifficulty = (room?.config?.difficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty).toString();
	const sharePercentage = shareTotal > 0 ? calculatePercentage(shareScore, shareTotal) : 0;
	const multiplayerShareText =
		shareTotal > 0
			? `${isWinner ? 'I won' : `I scored ${shareScore}/${shareTotal} (${sharePercentage}%)`} in an EveryTriv multiplayer game on ${shareTopic} (${formatDifficulty(shareDifficulty)})! Think you can beat my score?`
			: `I just played ${APP_NAME} multiplayer! ${isWinner ? 'I won!' : `Final score: ${myResult?.score ?? 0} points`}. Can you beat it?`;

	return (
		<main className='view-main animate-fade-in-scale-simple'>
			<div className='view-content-3xl-scroll'>
				{/* Winner Announcement */}
				<div className='text-center flex-shrink-0'>
					{isWinner && (
						<motion.div
							initial={{ scale: 0, rotate: -90 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={SPRING_CONFIGS.GENTLE}
						>
							<Trophy
								className={cn('w-16 md:w-20 lg:w-24 h-16 md:h-20 lg:h-24 mx-auto mb-2 md:mb-4', Colors.YELLOW_500.text)}
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
								<PartyPopper className={cn('w-8 h-8 md:w-10 md:h-10', Colors.AMBER_600.text)} />
								You Won!
							</>
						) : (
							'Game Over!'
						)}
					</motion.h1>
					{winner && (
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: ANIMATION_DELAYS.SEQUENCE_LARGE }}
							className='text-xl text-muted-foreground'
						>
							Winner: <span className='font-bold text-primary'>{getDisplayNameFromPlayer(winner)}</span> with{' '}
							<span className='font-bold'>{winner.score}</span> points
						</motion.p>
					)}
				</div>

				{/* Podium for top 3 */}
				{results.length >= 3 && (
					<div className='flex justify-center items-end gap-4 h-48'>
						{PODIUM_SLOTS.map((slot, displayIndex) => {
							const player = results[slot.resultIndex];
							if (!player) return null;
							const Icon = slot.icon;
							return (
								<motion.div
									key={player.userId}
									initial={{ opacity: 0, y: 50 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										delay:
											ANIMATION_DELAYS.SEQUENCE_STEP +
											ANIMATION_DELAYS.SEQUENCE_MEDIUM +
											displayIndex * ANIMATION_DELAYS.STAGGER_LARGE,
									}}
									className='flex flex-col items-center'
								>
									<UserAvatar player={player} size={AvatarSize.LG} className='border-2 border-background shadow-lg' />
									<span className='text-sm font-medium mt-1 max-w-20 truncate'>{getDisplayNameFromPlayer(player)}</span>
									<span className='text-xs text-muted-foreground'>{player.score} pts</span>
									<div
										className={cn(
											'w-20 rounded-t-lg flex items-center justify-center mt-2',
											slot.rank === 1 && cn('h-40', Colors.YELLOW_500.bg),
											slot.rank === 2 && cn('h-32', Colors.GRAY_400.bg),
											slot.rank === 3 && cn('h-24', Colors.AMBER_600.bg)
										)}
									>
										<Icon className='h-8 w-8 text-white' />
									</div>
								</motion.div>
							);
						})}
					</div>
				)}

				{/* Full Results */}
				<Card>
					<CardHeader>
						<CardTitle>Final Standings</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						{results.length === 0 ? (
							<p className='text-center text-muted-foreground py-6'>No results to display.</p>
						) : (
							results.map((player, index) => {
								const isCurrentUser = player.userId === currentUser?.id;

								return (
									<motion.div
										key={player.userId}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{
											delay:
												ANIMATION_DELAYS.SEQUENCE_LARGE +
												ANIMATION_DELAYS.SEQUENCE_STEP +
												index * ANIMATION_DELAYS.STAGGER_NORMAL,
										}}
										className={cn(
											'flex items-center gap-4 p-4 rounded-lg',
											isCurrentUser ? 'bg-primary/30 ring-2 ring-primary/60' : 'bg-muted/50'
										)}
									>
										<span
											className={cn(
												'text-3xl font-bold w-12',
												index + 1 === 1 && Colors.YELLOW_500.text,
												index + 1 === 2 && Colors.GRAY_400.text,
												index + 1 === 3 && Colors.AMBER_600.text,
												index + 1 > 3 && 'text-muted-foreground'
											)}
										>
											#{index + 1}
										</span>
										<UserAvatar player={player} size={AvatarSize.MD} />
										<div className='flex-1'>
											<div className='font-semibold flex items-center gap-2'>
												{getDisplayNameFromPlayer(player)}
												{isCurrentUser && <span className='text-xs text-muted-foreground'>(You)</span>}
											</div>
											<div className='text-sm text-muted-foreground'>{player.correctAnswers ?? 0} correct answers</div>
										</div>
										<div className='text-right'>
											<div className='text-2xl font-bold text-primary'>{player.score}</div>
											<div className='text-xs text-muted-foreground'>points</div>
										</div>
									</motion.div>
								);
							})
						)}
					</CardContent>
				</Card>

				{/* Game Stats */}
				{room && (
					<Card>
						<CardHeader>
							<CardTitle>Game Stats</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
								<StatCard icon={Users} label='Players' value={room.players?.length ?? 0} color={Colors.BLUE_500.text} />
								<StatCard
									icon={FileQuestion}
									label='Questions'
									value={room.questions?.length ?? 0}
									color={Colors.GREEN_500.text}
								/>
								<StatCard
									icon={Gauge}
									label='Difficulty'
									value={formatDifficulty(
										(room.config?.difficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty).toString()
									)}
									color={Colors.YELLOW_500.text}
								/>
								<StatCard
									icon={Tag}
									label='Topic'
									value={formatTitle(room.config?.topic ?? DEFAULT_GAME_CONFIG.defaultTopic)}
									color={Colors.PURPLE_500.text}
								/>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Action Buttons */}
				<div className='flex flex-col sm:flex-row gap-4'>
					<Button
						className='flex-1 min-w-0'
						variant={VariantBase.OUTLINE}
						size={ButtonSize.LG}
						onClick={handlePlayAgain}
					>
						<RotateCcw className='h-4 w-4 mr-2' />
						Play Again
					</Button>
					{results.length > 0 && (
						<div className='flex-1 min-w-0 flex'>
							<SocialShare
								score={shareScore}
								total={shareTotal > 0 ? shareTotal : 1}
								topic={shareTopic}
								difficulty={shareDifficulty}
								buttonLabel='Share Result'
								dialogTitle='Share your multiplayer result!'
								dialogDescription='Challenge your friends to beat your score in multiplayer.'
								shareText={multiplayerShareText}
								triggerClassName='w-full'
							/>
						</div>
					)}
					<HomeButton
						className='flex-1 min-w-0'
						onClick={() => {
							clearPersistedSummary();
							disconnect();
							navigate(ROUTES.HOME, { replace: true });
						}}
					/>
				</div>
			</div>
		</main>
	);
}
