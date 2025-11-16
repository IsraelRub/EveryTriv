import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import { clientLogger as logger } from '@shared/services';
import type { LeaderboardEntry } from '@shared/types';

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	createStaggerContainer,
	fadeInUp,
	GridLayout,
	Icon,
} from '../../components';
import { ButtonVariant, CardVariant, ComponentSize, Spacing } from '../../constants';
import { useGlobalLeaderboard, useLeaderboardByPeriod, useLeaderboardStats, useUserRanking } from '../../hooks';
import type { CardMetricProps, LeaderboardEntryProps } from '../../types';

export function LeaderboardView() {
	const [timeFilter, setTimeFilter] = useState<'global' | 'weekly' | 'monthly' | 'yearly'>('global');
	const [limit, setLimit] = useState(50);
	const [showPeriodComparison, setShowPeriodComparison] = useState(false);

	// Use leaderboard hooks
	const { data: userRanking, isLoading: userRankingLoading } = useUserRanking();
	const { data: globalLeaderboard, isLoading: globalLoading } = useGlobalLeaderboard();
	const periodFilter: 'weekly' | 'monthly' = timeFilter === 'global' || timeFilter === 'yearly' ? 'weekly' : timeFilter;
	const { data: periodLeaderboard, isLoading: periodLoading } = useLeaderboardByPeriod(periodFilter, limit);

	// Get stats for all periods
	const { data: weeklyStats, isLoading: weeklyStatsLoading } = useLeaderboardStats('weekly');
	const { data: monthlyStats, isLoading: monthlyStatsLoading } = useLeaderboardStats('monthly');
	const { data: yearlyStats, isLoading: yearlyStatsLoading } = useLeaderboardStats('yearly');

	useEffect(() => {
		logger.navigationPage('leaderboard', {
			timeFilter,
		});
	}, [timeFilter]);

	const isLoading = globalLoading || periodLoading || userRankingLoading;
	const leaderboardData = timeFilter === 'global' ? globalLeaderboard : periodLeaderboard;

	if (isLoading) {
		return (
			<main
				role='main'
				aria-label='Leaderboard'
				className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6'
			>
				<div className='max-w-7xl mx-auto'>
					<div role='status' aria-live='polite' className='animate-pulse'>
						<div className='h-8 bg-white/20 rounded w-1/3 mb-6'></div>
						<div className='space-y-4'>
							{[1, 2, 3, 4, 5].map(i => (
								<div key={i} className='h-20 bg-white/10 rounded-lg'></div>
							))}
						</div>
					</div>
				</div>
			</main>
		);
	}

	return (
		<motion.main
			role='main'
			aria-label='Leaderboard'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6'
		>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<header className='flex justify-between items-center mb-8'>
					<h1 className='text-3xl font-bold text-white'>Leaderboard</h1>
					<div className='flex space-x-2 rtl:space-x-reverse'>
						{(['global', 'weekly', 'monthly', 'yearly'] as const).map(filter => (
							<button
								key={filter}
								onClick={() => setTimeFilter(filter)}
								className={`px-4 py-2 rounded-lg transition-colors ${
									timeFilter === filter ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
								}`}
							>
								{filter === 'global'
									? 'Global'
									: filter === 'weekly'
										? 'Weekly'
										: filter === 'monthly'
											? 'Monthly'
											: 'Yearly'}
							</button>
						))}
						<Button
							variant={ButtonVariant.SECONDARY}
							onClick={() => setShowPeriodComparison(!showPeriodComparison)}
							className='ml-4 bg-blue-500 hover:bg-blue-600 text-white'
						>
							{showPeriodComparison ? 'Hide Comparison' : 'Compare Periods'}
						</Button>
					</div>
				</header>

				{/* Period Comparison */}
				{showPeriodComparison && (
					<Card variant={CardVariant.GLASS} className='mb-8'>
						<CardHeader>
							<CardTitle className='text-xl font-bold text-white'>Period Comparison</CardTitle>
						</CardHeader>
						<CardContent>
							<GridLayout variant='balanced' gap={Spacing.LG}>
								{[
									{ period: 'weekly' as const, stats: weeklyStats, isLoading: weeklyStatsLoading },
									{ period: 'monthly' as const, stats: monthlyStats, isLoading: monthlyStatsLoading },
									{ period: 'yearly' as const, stats: yearlyStats, isLoading: yearlyStatsLoading },
								].map(({ period, stats, isLoading }) => (
									<Card key={period} variant={CardVariant.GLASS} padding={Spacing.SM}>
										<CardContent>
											<h3 className='text-lg font-semibold text-white mb-3'>
												{period === 'weekly' ? 'Weekly' : period === 'monthly' ? 'Monthly' : 'Yearly'}
											</h3>
											{isLoading ? (
												<div className='space-y-2'>
													<div className='h-4 bg-white/10 rounded animate-pulse'></div>
													<div className='h-4 bg-white/10 rounded animate-pulse'></div>
													<div className='h-4 bg-white/10 rounded animate-pulse'></div>
												</div>
											) : (
												<div className='space-y-2'>
													<div className='flex justify-between'>
														<span className='text-sm text-white/70'>Active Users:</span>
														<span className='font-semibold text-white'>{stats?.activeUsers ?? 0}</span>
													</div>
													<div className='flex justify-between'>
														<span className='text-sm text-white/70'>Average Points:</span>
														<span className='font-semibold text-white'>{stats?.averagePoints ?? 0}</span>
													</div>
													<div className='flex justify-between'>
														<span className='text-sm text-white/70'>Average Games:</span>
														<span className='font-semibold text-white'>{stats?.averageGames ?? 0}</span>
													</div>
												</div>
											)}
										</CardContent>
									</Card>
								))}
							</GridLayout>
						</CardContent>
					</Card>
				)}

				{/* User Ranking Card */}
				{userRanking && (
					<Card variant={CardVariant.GLASS} className='mb-8'>
						<CardHeader>
							<CardTitle className='text-xl font-bold text-white'>Your Ranking</CardTitle>
						</CardHeader>
						<CardContent>
							<GridLayout variant='stats' gap={Spacing.MD}>
								<RankingCard
									title='Global Rank'
									value={userRanking.rank?.toString() || 'N/A'}
									subtitle={`Out of ${userRanking.totalUsers ?? 0} users`}
									icon={<Icon name='trophy' size={ComponentSize.LG} color='warning' />}
									color='yellow'
								/>
								<RankingCard
									title='Total Score'
									value={userRanking.score?.toLocaleString() || '0'}
									subtitle='Points earned'
									icon={<Icon name='star' size={ComponentSize.LG} color='primary' />}
									color='blue'
								/>
								<RankingCard
									title='Success Rate'
									value='N/A'
									subtitle='Average correct answers'
									icon={<Icon name='target' size={ComponentSize.LG} color='success' />}
									color='green'
								/>
								<RankingCard
									title='Daily Streak'
									value='N/A'
									subtitle='Consecutive days'
									icon={<Icon name='flame' size={ComponentSize.LG} color='error' />}
									color='red'
								/>
							</GridLayout>
						</CardContent>
					</Card>
				)}

				{/* Leaderboard */}
				<Card variant={CardVariant.GLASS}>
					<CardHeader>
						<div className='flex justify-between items-center'>
							<CardTitle className='text-xl font-bold text-white'>
								{timeFilter === 'global'
									? 'Global Leaderboard'
									: timeFilter === 'weekly'
										? 'Weekly Leaderboard'
										: timeFilter === 'monthly'
											? 'Monthly Leaderboard'
											: 'Yearly Leaderboard'}
							</CardTitle>
							<div className='flex space-x-2 rtl:space-x-reverse'>
								{[25, 50, 100].map(l => (
									<button
										key={l}
										onClick={() => setLimit(l)}
										className={`px-3 py-1 rounded text-sm ${
											limit === l ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
										}`}
									>
										{l}
									</button>
								))}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{leaderboardData && Array.isArray(leaderboardData) && leaderboardData.length > 0 ? (
							<motion.div
								className='space-y-3'
								variants={createStaggerContainer(0.05)}
								initial='hidden'
								animate='visible'
							>
								{leaderboardData.map((entry: LeaderboardEntry) => (
									<motion.div key={entry.userId} variants={fadeInUp}>
										<LeaderboardEntry entry={entry} isCurrentUser={false} />
									</motion.div>
								))}
							</motion.div>
						) : (
							<div className='text-center py-12'>
								<div className='text-gray-500 text-lg'>No data available</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</motion.main>
	);
}

// Ranking Card Component

function RankingCard({ title, value, subtitle, icon, color }: CardMetricProps) {
	const colorClasses: Record<CardMetricProps['color'], string> = {
		yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
		blue: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
		green: 'bg-green-500/20 text-green-300 border-green-400/30',
		red: 'bg-red-500/20 text-red-300 border-red-400/30',
		purple: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
	};

	return (
		<Card variant={CardVariant.GLASS} padding={Spacing.SM} className='border border-white/10'>
			<CardContent>
				<div className='flex items-center justify-between'>
					<div>
						<p className='text-sm font-medium text-white/70'>{title}</p>
						<p className='text-2xl font-bold text-white'>{value}</p>
						<p className='text-xs text-white/50'>{subtitle}</p>
					</div>
					<div className={`p-3 rounded-full border ${colorClasses[color]}`}>{icon}</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Leaderboard Entry Component

function LeaderboardEntry({ entry, isCurrentUser }: LeaderboardEntryProps) {
	const getRankIcon = (rank: number) => {
		if (rank === 1) return <Icon name='medal' size={ComponentSize.LG} color='warning' />;
		if (rank === 2) return <Icon name='medal' size={ComponentSize.MD} color='muted' />;
		if (rank === 3) return <Icon name='medal' size={ComponentSize.SM} color='error' />;
		return `#${rank}`;
	};

	const getRankColor = (rank: number) => {
		if (rank <= 3) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
		if (rank <= 10) return 'bg-gradient-to-r from-gray-400 to-gray-600';
		return 'bg-gradient-to-r from-blue-400 to-blue-600';
	};

	return (
		<div
			className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
				isCurrentUser ? 'border-yellow-400 bg-yellow-500/10' : 'border-white/20 bg-white/5 hover:border-white/30'
			}`}
		>
			<div className='flex items-center space-x-4 rtl:space-x-reverse'>
				<div
					className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getRankColor(entry.rank)}`}
				>
					{typeof getRankIcon(entry.rank) === 'string' ? (
						<span className='text-sm font-bold'>{getRankIcon(entry.rank)}</span>
					) : (
						getRankIcon(entry.rank)
					)}
				</div>
				<div>
					<h3 className='font-semibold text-white flex items-center'>
						{entry.username}
						{isCurrentUser && (
							<span className='ml-2 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded border border-yellow-400/30'>
								You
							</span>
						)}
					</h3>
					<p className='text-sm text-white/70 flex items-center gap-2'>
						<span>{entry.gamesPlayed ?? 0} games</span>
						<Icon name='dot' size={ComponentSize.XS} className='text-white/40' />
						<span>{entry.successRate.toFixed(1)}% success</span>
					</p>
				</div>
			</div>
			<div className='text-right'>
				<p className='text-lg font-bold text-white'>{entry.score.toLocaleString()}</p>
				<p className='text-sm text-white/70'>points</p>
				{entry.gamesPlayed && entry.gamesPlayed > 0 && (
					<p className='text-xs text-orange-400 flex items-center'>
						<Icon name='gamepad' size={ComponentSize.XS} color='warning' className='mr-1' />
						{entry.gamesPlayed} games
					</p>
				)}
			</div>
		</div>
	);
}
