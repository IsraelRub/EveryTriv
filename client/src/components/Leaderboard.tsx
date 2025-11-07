import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { motion } from 'framer-motion';

import { clientLogger as logger } from '@shared/services';
import { LeaderboardEntry } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { CardVariant, ComponentSize, Spacing } from '../constants';
import { gameHistoryService } from '../services';
import { LeaderboardProps } from '../types';
import { isToday, isYesterday } from '../utils';
import { createStaggerContainer, fadeInLeft, fadeInUp } from './animations';
import { Icon } from './IconLibrary';
import { Avatar } from './ui';
import { Card } from './ui/Card';

const Leaderboard = memo(function Leaderboard({ userId }: LeaderboardProps) {
	const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');

	const fetchLeaderboard = useCallback(async () => {
		try {
			setLoading(true);
			// Use the game history service instead of the API service for better compatibility
			const data = await gameHistoryService.getLeaderboard(10);
			// Ensure we have an array
			const leaderboardData = Array.isArray(data) ? data : [];
			setEntries(leaderboardData);
			setError('');
		} catch (err) {
			logger.analyticsError('Failed to fetch leaderboard', {
				error: getErrorMessage(err),
			});
			setError('Failed to load leaderboard');
			setEntries([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchLeaderboard();
	}, [fetchLeaderboard]);

	// Helper function to get rank styling and medal info
	const getRankInfo = useCallback((rank: number) => {
		switch (rank) {
			case 1:
				return {
					backgroundColor: 'bg-yellow-500 text-black',
					medalIcon: 'medal' as const,
					medalColor: 'warning' as const,
					showMedal: true,
				};
			case 2:
				return {
					backgroundColor: 'bg-gray-400 text-black',
					medalIcon: 'medal' as const,
					medalColor: 'muted' as const,
					showMedal: true,
				};
			case 3:
				return {
					backgroundColor: 'bg-orange-600 text-white',
					medalIcon: 'medal' as const,
					medalColor: 'muted' as const,
					showMedal: true,
				};
			default:
				return {
					backgroundColor: 'bg-blue-500/20 text-blue-300',
					medalIcon: null,
					medalColor: null,
					showMedal: false,
				};
		}
	}, []);

	const processedEntries = useMemo(() => {
		return entries.map((entry, index) => {
			const rank = index + 1;
			const rankInfo = getRankInfo(rank);

			return {
				...entry,
				rank,
				isCurrentUser: entry.userId === userId,
				formattedScore: entry.score?.toLocaleString() ?? '0',
				rankInfo,
			};
		});
	}, [entries, userId, getRankInfo]);

	if (loading) {
		return (
			<article className='glass rounded-lg p-6 mt-6'>
				<h3 className='text-xl font-semibold text-white mb-4'>
					<Icon name='trophy' size={ComponentSize.SM} className='mr-1' /> Leaderboard
				</h3>
				<div role='status' aria-live='polite' className='flex items-center justify-center py-8'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3'></div>
					<p className='text-white/80'>Loading...</p>
				</div>
			</article>
		);
	}

	if (error) {
		return (
			<article className='glass rounded-lg p-6 mt-6'>
				<h3 className='text-xl font-semibold text-white mb-4'>
					<Icon name='trophy' size={ComponentSize.SM} className='mr-1' /> Leaderboard
				</h3>
				<Card
					variant={CardVariant.TRANSPARENT}
					padding={Spacing.LG}
					className='rounded-lg border border-red-400/30 bg-red-500/20 text-center'
				>
					<p className='text-red-300'>{error}</p>
				</Card>
			</article>
		);
	}

	return (
		<article className='glass rounded-lg p-6 mt-6'>
			<motion.div variants={fadeInUp} initial='hidden' animate='visible'>
				<h3 className='text-xl font-semibold text-white mb-6'>
					<Icon name='trophy' size={ComponentSize.SM} className='mr-1' /> Leaderboard
				</h3>
				{entries.length === 0 ? (
					<div className='text-center py-8'>
						<p className='text-white/60'>No entries yet</p>
						<p className='text-white/40 text-sm mt-2'>Be the first to appear on the leaderboard!</p>
					</div>
				) : (
					<motion.div variants={createStaggerContainer(0.05)} initial='hidden' animate='visible' className='space-y-3'>
						{processedEntries.map((entry, i) => (
							<motion.div
								key={entry.userId || i}
								variants={fadeInLeft}
								initial='hidden'
								animate='visible'
								transition={{ delay: i * 0.05 }}
							>
								<div
									key={entry.userId || i}
									className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
										entry.isCurrentUser
											? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 ring-2 ring-yellow-400/20'
											: 'bg-white/5 hover:bg-white/10 border border-white/10'
									}`}
								>
									<div className='flex items-center space-x-4'>
										<div className='flex items-center space-x-3'>
											<Avatar
												src={entry.avatar}
												username={entry.username}
												fullName={entry.fullName}
												size={ComponentSize.SM}
												alt={entry.username ?? entry.userId}
											/>
											<div
												className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${entry.rankInfo.backgroundColor}`}
											>
												{entry.rankInfo.showMedal ? (
													<Icon
														name={entry.rankInfo.medalIcon ?? 'medal'}
														size={ComponentSize.XS}
														color={entry.rankInfo.medalColor ?? 'warning'}
													/>
												) : (
													entry.rank
												)}
											</div>
										</div>
										<div>
											<div className='font-medium text-white'>
												{entry.userId === userId ? (
													<>
														<Icon name='user' size={ComponentSize.SM} className='mr-1' /> You
													</>
												) : (
													(entry.username ?? entry.userId)
												)}
											</div>
											{entry.userId === userId && <div className='text-yellow-400 text-sm'>Your score</div>}
										</div>
									</div>
									<div className='text-right'>
										<div className='text-lg font-bold text-white'>{entry.formattedScore}</div>
										<div className='text-white/60 text-sm'>points</div>
										{entry.lastPlayed && (
											<div className='text-white/40 text-xs mt-1'>
												{isToday(new Date(entry.lastPlayed))
													? 'Today'
													: isYesterday(new Date(entry.lastPlayed))
														? 'Yesterday'
														: new Date(entry.lastPlayed).toLocaleDateString()}
											</div>
										)}
									</div>
								</div>
							</motion.div>
						))}
					</motion.div>
				)}
			</motion.div>
		</article>
	);
});

export default Leaderboard;
