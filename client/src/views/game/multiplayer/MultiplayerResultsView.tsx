import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, Crown, FileQuestion, Layers, Medal, RotateCcw, Share2, Trophy, Users } from 'lucide-react';

import { ANIMATION_DELAYS, BgColor, ButtonSize, ButtonVariant, ROUTES, SPRING_CONFIGS } from '@/constants';
import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	HomeButton,
	LinkButton,
	StatCard,
} from '@/components';
import { useCurrentUserData, useMultiplayer, useNavigationClose } from '@/hooks';
import { clientLogger as logger } from '@/services';
import { cn } from '@/utils';

const podiumColors = ['bg-yellow-500', 'bg-gray-400', 'bg-amber-700'];
const podiumIcons = [Crown, Medal, Award];

function getRankColor(rank: number): string {
	switch (rank) {
		case 1:
			return 'text-yellow-500';
		case 2:
			return 'text-gray-400';
		case 3:
			return 'text-amber-700';
		default:
			return 'text-muted-foreground';
	}
}

export function MultiplayerResultsView() {
	const { handleClose } = useNavigationClose();

	const { leaderboard, room, disconnect } = useMultiplayer();
	const currentUser = useCurrentUserData();

	const results = leaderboard.length > 0 ? leaderboard : [];
	const winner = results[0];
	const isWinner = winner?.userId === currentUser?.id;

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// Disconnect when leaving results page
		};
	}, []);

	const handleShare = async () => {
		const shareText = `I just played EveryTriv multiplayer! ${isWinner ? '🏆 I won!' : `Final score: ${results.find(r => r.userId === currentUser?.id)?.score ?? 0}`}`;

		try {
			if (navigator.share) {
				await navigator.share({
					title: 'EveryTriv Multiplayer',
					text: shareText,
				});
			} else {
				await navigator.clipboard.writeText(shareText);
				logger.userSuccess('Result copied to clipboard');
			}
		} catch (error) {
			// User cancelled share or error occurred
			if (error instanceof Error && error.name !== 'AbortError') {
				logger.userError('Failed to share result', {
					errorInfo: { message: error.message },
				});
			}
		}
	};

	return (
		<main className='h-screen overflow-hidden pt-0 pb-4 md:pb-6 px-4 animate-fade-in-scale-simple'>
			<div className='max-w-3xl mx-auto h-full flex flex-col space-y-4 md:space-y-6 lg:space-y-8 overflow-y-auto'>
				{/* Winner Announcement */}
				<div className='text-center flex-shrink-0'>
					<motion.div
						initial={{ scale: 0, rotate: -90 }}
						animate={{ scale: 1, rotate: 0 }}
						transition={SPRING_CONFIGS.GENTLE}
					>
						<Trophy className='w-16 md:w-20 lg:w-24 h-16 md:h-20 lg:h-24 text-yellow-500 mx-auto mb-2 md:mb-4' />
					</motion.div>
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: ANIMATION_DELAYS.SEQUENCE_MEDIUM }}
						className='text-3xl md:text-4xl font-bold mb-1 md:mb-2'
					>
						{isWinner ? '🎉 You Won!' : 'Game Over!'}
					</motion.h1>
					{winner && (
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: ANIMATION_DELAYS.SEQUENCE_LARGE }}
							className='text-xl text-muted-foreground'
						>
							Winner: <span className='font-bold text-primary'>{winner.displayName ?? 'Player'}</span> with{' '}
							<span className='font-bold'>{winner.score}</span> points
						</motion.p>
					)}
				</div>

				{/* Podium for top 3 */}
				{results.length >= 3 && (
					<div className='flex justify-center items-end gap-4 h-48'>
						{[1, 0, 2].map((podiumIndex, displayIndex) => {
							const player = results[podiumIndex];
							if (!player) return null;

							const PodiumIcon = podiumIcons[podiumIndex];
							if (PodiumIcon == null) {
								return null;
							}

							const heights = ['h-32', 'h-40', 'h-24'];

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
									<Avatar className='h-12 w-12 border-2 border-background shadow-lg'>
										<AvatarFallback>{player.displayName?.charAt(0) ?? 'P'}</AvatarFallback>
									</Avatar>
									<span className='text-sm font-medium mt-1 max-w-20 truncate'>{player.displayName ?? 'Player'}</span>
									<span className='text-xs text-muted-foreground'>{player.score} pts</span>
									<div
										className={cn(
											'w-20 rounded-t-lg flex items-center justify-center mt-2',
											heights[displayIndex],
											podiumColors[podiumIndex]
										)}
									>
										<PodiumIcon className='h-8 w-8 text-white' />
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
						{results.map((player, index) => {
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
									<span className={cn('text-3xl font-bold w-12', getRankColor(index + 1))}>#{index + 1}</span>
									<Avatar className='h-10 w-10'>
										<AvatarFallback>{player.displayName?.charAt(0) ?? 'P'}</AvatarFallback>
									</Avatar>
									<div className='flex-1'>
										<div className='font-semibold flex items-center gap-2'>
											{player.displayName ?? 'Player'}
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
						})}
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
								<StatCard
									icon={Users}
									label='Players'
									value={room.players?.length ?? 0}
									color={BgColor.BLUE_500}
									countUp
								/>
								<StatCard
									icon={FileQuestion}
									label='Questions'
									value={room.questions?.length ?? 0}
									color={BgColor.GREEN_500}
									countUp
								/>
								<StatCard
									icon={Layers}
									label='Difficulty'
									value={(room.config?.difficulty ?? 'Medium').toString()}
									color={BgColor.YELLOW_500}
								/>
								<StatCard
									icon={BookOpen}
									label='Topic'
									value={room.config?.topic ?? 'General'}
									color={BgColor.PURPLE_500}
								/>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Action Buttons */}
				<div className='flex flex-col sm:flex-row gap-4'>
					<LinkButton to={ROUTES.MULTIPLAYER} className='flex-1' variant={ButtonVariant.OUTLINE} size={ButtonSize.LG}>
						<RotateCcw className='h-4 w-4 mr-2' />
						Play Again
					</LinkButton>
					<Button variant={ButtonVariant.OUTLINE} size={ButtonSize.LG} onClick={handleShare}>
						<Share2 className='h-4 w-4 mr-2' />
						Share Result
					</Button>
					<HomeButton
						onClick={() => {
							disconnect();
							handleClose();
						}}
					/>
				</div>
			</div>
		</main>
	);
}
