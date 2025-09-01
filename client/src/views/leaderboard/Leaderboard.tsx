import {
	DifficultyLevel,
	VALID_GAME_MODES,
} from 'everytriv-shared/constants';
import { useState } from 'react';

import { FadeInDown, FadeInLeft, FadeInUp } from '../../components/animations';
import { Icon } from '../../components/icons';
import { Container, GridLayout, Section } from '../../components/layout';
import { AudioKey } from '../../constants';
import { useDebouncedCallback, useLeaderboard } from '../../hooks';
import { audioService, logger, storageService } from '../../services';

export default function Leaderboard() {
	const [timeFilter, setTimeFilter] = useState('all');
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [difficultyFilter, setDifficultyFilter] = useState('all');
	const [userStats] = useState<any>(null);
	const [userId] = useState<string>('');

	// Performance tracking


	// Debounce filters to avoid excessive API calls


	// Debounced filter changes with logging
	const debouncedFilterChange = useDebouncedCallback((filterType: string, value: string) => {
		logger.game('Leaderboard filter changed', {
			filter: filterType,
			value,
			gameModes: VALID_GAME_MODES,
			
			timestamp: new Date().toISOString(),
		});

		// Save filter preferences to storage
		storageService.setItem('leaderboard-filters', {
			timeFilter,
			categoryFilter,
			difficultyFilter,
			lastUpdated: new Date().toISOString(),
		});
	}, 500);

	// Use custom hook for global leaderboard
	const { data: leaderboard = [], isLoading: loading, error } = useLeaderboard(100);

	// Handle filter changes with audio feedback
	const handleTimeFilterChange = (value: string) => {
		audioService.play(AudioKey.BUTTON_CLICK);
		setTimeFilter(value);
		debouncedFilterChange.debounced('time', value);
	};

	const handleCategoryFilterChange = (value: string) => {
		audioService.play(AudioKey.BUTTON_CLICK);
		setCategoryFilter(value);
		debouncedFilterChange.debounced('category', value);
	};

	const handleDifficultyFilterChange = (value: string) => {
		audioService.play(AudioKey.BUTTON_CLICK);
		setDifficultyFilter(value);
		debouncedFilterChange.debounced('difficulty', value);

		// Log difficulty multiplier info
		if (value !== 'all') {
			const multiplier = 1.0;
			logger.game('Difficulty filter applied', {
				difficulty: value,
				multiplier,
				timestamp: new Date().toISOString(),
			});
		}
	};

	return (
		<Container size='xl' className='min-h-screen flex flex-col items-center justify-start p-4 pt-20'>
			<Section padding='xl' className='w-full space-y-8'>
				{/* Header */}
				<FadeInDown className='text-center mb-12' delay={0.2}>
					<h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>Leaderboard</h1>
					<p className='text-xl text-slate-300'>See how you rank against other players</p>
				</FadeInDown>

				{/* Filters */}
				<FadeInUp delay={0.4}>
					<Section background='glass' padding='lg' className='rounded-lg'>
						<GridLayout variant='content' gap='lg' className='items-center'>
							<div>
								<label className='block text-white font-medium mb-2'>Time Period</label>
								<select
									value={timeFilter}
									onChange={(e) => handleTimeFilterChange(e.target.value)}
									className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
								>
									<option value='all'>All Time</option>
									<option value='week'>This Week</option>
									<option value='month'>This Month</option>
									<option value='year'>This Year</option>
								</select>
							</div>
							<div>
								<label className='block text-white font-medium mb-2'>Category</label>
								<select
									value={categoryFilter}
									onChange={(e) => handleCategoryFilterChange(e.target.value)}
									className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
								>
									<option value='all'>All Categories</option>
									<option value='science'>Science</option>
									<option value='history'>History</option>
									<option value='geography'>Geography</option>
									<option value='sports'>Sports</option>
									<option value='entertainment'>Entertainment</option>
								</select>
							</div>
							<div>
								<label className='block text-white font-medium mb-2'>Difficulty</label>
								<select
									value={difficultyFilter}
									onChange={(e) => handleDifficultyFilterChange(e.target.value)}
									className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
								>
									<option value='all'>All Difficulties</option>
									<option value={DifficultyLevel.EASY}>Easy</option>
									<option value={DifficultyLevel.MEDIUM}>Medium</option>
									<option value={DifficultyLevel.HARD}>Hard</option>
									<option value={DifficultyLevel.CUSTOM}>Custom</option>
								</select>
							</div>
						</GridLayout>
					</Section>
				</FadeInUp>

				{/* Leaderboard Table */}
				<FadeInUp delay={0.6}>
					<Section background='glass' padding='lg' className='rounded-lg'>
						<h2 className='text-2xl font-bold text-white mb-6'>Top Players</h2>
						{loading ? (
							<div className='text-center py-8'>
								<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto'></div>
								<p className='text-slate-300 mt-2'>Loading leaderboard...</p>
							</div>
						) : error ? (
							<div className='text-center py-8'>
								<Icon name='alerttriangle' size='2xl' color='error' className='mx-auto mb-4' />
								<p className='text-red-400'>{error?.message || 'An error occurred'}</p>
							</div>
						) : !Array.isArray(leaderboard) || leaderboard.length === 0 ? (
							<div className='text-center py-8'>
								<Icon name='alerttriangle' size='2xl' color='warning' className='mx-auto mb-4' />
								<h3 className='text-xl font-semibold text-white mb-2'>No Leaderboard Data</h3>
								<p className='text-slate-300'>No players found. Be the first to play and get on the leaderboard!</p>
							</div>
						) : (
							<div className='overflow-x-auto'>
								<table className='w-full'>
									<thead>
										<tr className='border-b border-white/10'>
											<th className='text-left py-3 px-4 text-white font-semibold'>Rank</th>
											<th className='text-left py-3 px-4 text-white font-semibold'>Player</th>
											<th className='text-left py-3 px-4 text-white font-semibold'>Score</th>
											<th className='text-left py-3 px-4 text-white font-semibold'>Games</th>
											<th className='text-left py-3 px-4 text-white font-semibold'>Accuracy</th>
											<th className='text-left py-3 px-4 text-white font-semibold'>Best Streak</th>
										</tr>
									</thead>
									<tbody>
										{Array.isArray(leaderboard) &&
											leaderboard.map((player, index) => (
												<FadeInLeft key={player.userId} delay={index * 0.05}>
													<tr
														className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
															player.userId === userId ? 'bg-blue-500/10' : ''
														}`}
													>
														<td className='py-3 px-4'>
															<div className='flex items-center'>
																{index < 3 ? (
																	<span className='text-2xl mr-2'>
																		{index === 0 ? (
																			<Icon name='medal' size='xl' color='warning' />
																		) : index === 1 ? (
																			<Icon name='medal' size='lg' color='muted' />
																		) : (
																			<Icon name='medal' size='md' color='muted' />
																		)}
																	</span>
																) : null}
																<span className='text-white font-medium'>#{index + 1}</span>
															</div>
														</td>
														<td className='py-3 px-4'>
															<div className='flex items-center'>
																<div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3'>
																	<span className='text-white font-bold text-sm'>
																		{player.username?.charAt(0) || 'U'}
																	</span>
																</div>
																<span className='text-white'>{player.username || 'Anonymous'}</span>
															</div>
														</td>
														<td className='py-3 px-4'>
															<span className='text-green-400 font-bold'>{player.score}</span>
														</td>
														<td className='py-3 px-4'>
															<span className='text-white'>{player.gamesPlayed || 0}</span>
														</td>
														<td className='py-3 px-4'>
															<span className='text-blue-400'>N/A</span>
														</td>
														<td className='py-3 px-4'>
															<span className='text-yellow-400'>N/A</span>
														</td>
													</tr>
												</FadeInLeft>
											))}
									</tbody>
								</table>
							</div>
						)}
					</Section>
				</FadeInUp>

				{/* User Stats */}
				{userStats && (
					<FadeInUp delay={0.8}>
						<Section background='glass' padding='lg' className='rounded-lg'>
							<h2 className='text-2xl font-bold text-white mb-6'>Your Performance</h2>
							<GridLayout variant='stats' gap='lg'>
								<div className='text-center'>
									<div className='text-3xl font-bold text-white mb-2'>{userStats.rank}</div>
									<div className='text-slate-300'>Your Rank</div>
								</div>
								<div className='text-center'>
									<div className='text-3xl font-bold text-green-400 mb-2'>{userStats.totalScore}</div>
									<div className='text-slate-300'>Total Score</div>
								</div>
								<div className='text-center'>
									<div className='text-3xl font-bold text-blue-400 mb-2'>{userStats.totalGames}</div>
									<div className='text-slate-300'>Games Played</div>
								</div>
								<div className='text-center'>
									<div className='text-3xl font-bold text-yellow-400 mb-2'>{userStats.bestStreak}</div>
									<div className='text-slate-300'>Best Streak</div>
								</div>
							</GridLayout>
						</Section>
					</FadeInUp>
				)}
			</Section>
		</Container>
	);
}
