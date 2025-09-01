import { isToday, isYesterday } from 'everytriv-shared/utils';
import { useEffect, useState } from 'react';

import { gameHistoryService } from '@/services/game';
import { logger } from '@/services/utils';
import { LeaderboardEntry, LeaderboardProps } from '@/types';

import { FadeInLeft, FadeInUp, FloatingCard, StaggerContainer } from '../animations';
import { Icon } from '../icons';

export default function Leaderboard({ userId }: LeaderboardProps) {
	const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		const fetchLeaderboard = async () => {
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
					error: err instanceof Error ? err.message : String(err) 
				});
				setError('Failed to load leaderboard');
				setEntries([]);
			} finally {
				setLoading(false);
			}
		};

		fetchLeaderboard();
	}, []);

	if (loading) {
		return (
			<FloatingCard>
				<div className='glass rounded-lg p-6 mt-6'>
					<h3 className='text-xl font-semibold text-white mb-4'>
						<Icon name='trophy' size='sm' className='mr-1' /> Leaderboard
					</h3>
					<div className='flex items-center justify-center py-8'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3'></div>
						<p className='text-white/80'>Loading...</p>
					</div>
				</div>
			</FloatingCard>
		);
	}

	if (error) {
		return (
			<FloatingCard>
				<div className='glass rounded-lg p-6 mt-6'>
					<h3 className='text-xl font-semibold text-white mb-4'>
						<Icon name='trophy' size='sm' className='mr-1' /> Leaderboard
					</h3>
					<div className='bg-red-500/20 border border-red-400/30 rounded-lg p-4 text-center'>
						<p className='text-red-300'>{error}</p>
					</div>
				</div>
			</FloatingCard>
		);
	}

	return (
		<FloatingCard>
			<FadeInUp className='glass rounded-lg p-6 mt-6'>
				<h3 className='text-xl font-semibold text-white mb-6'>
					<Icon name='trophy' size='sm' className='mr-1' /> Leaderboard
				</h3>
				{entries.length === 0 ? (
					<div className='text-center py-8'>
						<p className='text-white/60'>No entries yet</p>
						<p className='text-white/40 text-sm mt-2'>Be the first to appear on the leaderboard!</p>
					</div>
				) : (
					<StaggerContainer className='space-y-3'>
						{entries.map((entry, i) => (
							<FadeInLeft key={entry.userId || i} delay={i * 0.05}>
								<div
									key={entry.userId || i}
									className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
										entry.userId === userId
											? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 ring-2 ring-yellow-400/20'
											: 'bg-white/5 hover:bg-white/10 border border-white/10'
									}`}
								>
									<div className='flex items-center space-x-4'>
										<div
											className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
												i === 0
													? 'bg-yellow-500 text-black'
													: i === 1
														? 'bg-gray-400 text-black'
														: i === 2
															? 'bg-orange-600 text-white'
															: 'bg-blue-500/20 text-blue-300'
											}`}
										>
											{i === 0 ? (
												<Icon name='medal' size='sm' color='warning' />
											) : i === 1 ? (
												<Icon name='medal' size='sm' color='muted' />
											) : i === 2 ? (
												<Icon name='medal' size='sm' color='muted' />
											) : (
												i + 1
											)}
										</div>
										<div>
											<div className='font-medium text-white'>
												{entry.userId === userId ? (
													<>
														<Icon name='user' size='sm' className='mr-1' /> You
													</>
												) : (
													entry.username || entry.userId
												)}
											</div>
											{entry.userId === userId && <div className='text-yellow-400 text-sm'>Your score</div>}
										</div>
									</div>
									<div className='text-right'>
										<div className='text-lg font-bold text-white'>{entry.score}</div>
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
							</FadeInLeft>
						))}
					</StaggerContainer>
				)}
			</FadeInUp>
		</FloatingCard>
	);
}
