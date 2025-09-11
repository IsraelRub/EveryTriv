import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserRanking, useGlobalLeaderboard, useLeaderboardByPeriod } from '../../hooks/api';
import { clientLogger, type LeaderboardEntry } from '@shared';
import { Button } from '../../components/ui';
import { Icon } from '../../components/icons';


export function LeaderboardView() {
	
	const [timeFilter, setTimeFilter] = useState<'global' | 'weekly' | 'monthly' | 'yearly'>('global');
	const [limit, setLimit] = useState(50);
	const [showPeriodComparison, setShowPeriodComparison] = useState(false);

	// Use leaderboard hooks
	const { data: userRanking, isLoading: userRankingLoading } = useUserRanking();
	const { data: globalLeaderboard, isLoading: globalLoading } = useGlobalLeaderboard();
	const { data: periodLeaderboard, isLoading: periodLoading } = useLeaderboardByPeriod(
		timeFilter as 'weekly' | 'monthly' | 'yearly', 
		limit
	);

	useEffect(() => {
		clientLogger.info('Leaderboard view loaded', {
			timeFilter,
		});
	}, [timeFilter]);

	const isLoading = globalLoading || periodLoading || userRankingLoading;
	const leaderboardData = timeFilter === 'global' ? globalLeaderboard : periodLeaderboard;

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
				<div className="max-w-7xl mx-auto">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
						<div className="space-y-4">
							{[1, 2, 3, 4, 5].map(i => (
								<div key={i} className="h-20 bg-gray-300 rounded-lg"></div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6"
		>
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
					<div className="flex space-x-2 rtl:space-x-reverse">
						{(['global', 'weekly', 'monthly', 'yearly'] as const).map(filter => (
							<button
								key={filter}
								onClick={() => setTimeFilter(filter)}
								className={`px-4 py-2 rounded-lg transition-colors ${
									timeFilter === filter
										? 'bg-purple-600 text-white'
										: 'bg-white text-gray-700 hover:bg-gray-50'
								}`}
							>
								{filter === 'global' ? 'Global' : 
								 filter === 'weekly' ? 'Weekly' :
								 filter === 'monthly' ? 'Monthly' : 'Yearly'}
							</button>
						))}
						<Button
							variant='secondary'
							onClick={() => setShowPeriodComparison(!showPeriodComparison)}
							className='ml-4 bg-blue-500 hover:bg-blue-600 text-white'
						>
							{showPeriodComparison ? 'Hide Comparison' : 'Compare Periods'}
						</Button>
					</div>
				</div>

				{/* Period Comparison */}
				{showPeriodComparison && (
					<div className="bg-white rounded-lg shadow-lg p-6 mb-8">
						<h2 className="text-xl font-bold text-gray-900 mb-4">Period Comparison</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{['weekly', 'monthly', 'yearly'].map(period => (
								<div key={period} className="bg-gray-50 rounded-lg p-4">
									<h3 className="text-lg font-semibold text-gray-900 mb-3">
										{period === 'weekly' ? 'Weekly' : period === 'monthly' ? 'Monthly' : 'Yearly'}
									</h3>
									<div className="space-y-2">
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Active Users:</span>
											<span className="font-semibold text-gray-900">
												{Math.floor(Math.random() * 1000) + 100}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Average Points:</span>
											<span className="font-semibold text-gray-900">
												{Math.floor(Math.random() * 5000) + 1000}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Average Games:</span>
											<span className="font-semibold text-gray-900">
												{Math.floor(Math.random() * 50) + 10}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* User Ranking Card */}
				{userRanking && (
					<div className="bg-white rounded-lg shadow-lg p-6 mb-8">
						<h2 className="text-xl font-bold text-gray-900 mb-4">Your Ranking</h2>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<RankingCard
								title="Global Rank"
								value={userRanking.rank?.toString() || 'N/A'}
								subtitle={`Out of ${userRanking.totalUsers || 0} users`}
								icon={<Icon name="trophy" size="lg" color="warning" />}
								color="yellow"
							/>
							<RankingCard
								title="Total Score"
								value={userRanking.score?.toLocaleString() || '0'}
								subtitle="Points earned"
								icon={<Icon name="star" size="lg" color="primary" />}
								color="blue"
							/>
							<RankingCard
								title="Success Rate"
								value="N/A"
								subtitle="Average correct answers"
								icon={<Icon name="target" size="lg" color="success" />}
								color="green"
							/>
							<RankingCard
								title="Daily Streak"
								value="N/A"
								subtitle="Consecutive days"
								icon={<Icon name="flame" size="lg" color="error" />}
								color="red"
							/>
						</div>
					</div>
				)}

				{/* Leaderboard */}
				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-xl font-bold text-gray-900">
							{timeFilter === 'global' ? 'Global Leaderboard' :
							 timeFilter === 'weekly' ? 'Weekly Leaderboard' :
							 timeFilter === 'monthly' ? 'Monthly Leaderboard' : 'Yearly Leaderboard'}
						</h2>
						<div className="flex space-x-2 rtl:space-x-reverse">
							{[25, 50, 100].map(l => (
								<button
									key={l}
									onClick={() => setLimit(l)}
									className={`px-3 py-1 rounded text-sm ${
										limit === l
											? 'bg-purple-600 text-white'
											: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
									}`}
								>
									{l}
								</button>
							))}
						</div>
					</div>

					{leaderboardData && Array.isArray(leaderboardData) && leaderboardData.length > 0 ? (
						<div className="space-y-3">
							{leaderboardData.map((entry: LeaderboardEntry, index: number) => (
								<LeaderboardEntry
									key={entry.userId}
									entry={entry}
									index={index}
									isCurrentUser={false}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<div className="text-gray-500 text-lg">No data available</div>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
}

// Ranking Card Component
import { RankingCardProps } from '../../types';

function RankingCard({ title, value, subtitle, icon, color }: RankingCardProps) {
	const colorClasses = {
		yellow: 'bg-yellow-100 text-yellow-800',
		blue: 'bg-blue-100 text-blue-800',
		green: 'bg-green-100 text-green-800',
		red: 'bg-red-100 text-red-800',
		purple: 'bg-purple-100 text-purple-800',
	};

	return (
		<div className="bg-gray-50 rounded-lg p-4">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-medium text-gray-600">{title}</p>
					<p className="text-2xl font-bold text-gray-900">{value}</p>
					<p className="text-xs text-gray-500">{subtitle}</p>
				</div>
				<div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
					{icon}
				</div>
			</div>
		</div>
	);
}

// Leaderboard Entry Component
import { LeaderboardEntryProps } from '../../types';

function LeaderboardEntry({ entry, index, isCurrentUser }: LeaderboardEntryProps) {
	const getRankIcon = (rank: number) => {
		if (rank === 1) return <Icon name="medal" size="lg" color="warning" />;
		if (rank === 2) return <Icon name="medal" size="md" color="muted" />;
		if (rank === 3) return <Icon name="medal" size="sm" color="error" />;
		return `#${rank}`;
	};

	const getRankColor = (rank: number) => {
		if (rank <= 3) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
		if (rank <= 10) return 'bg-gradient-to-r from-gray-400 to-gray-600';
		return 'bg-gradient-to-r from-blue-400 to-blue-600';
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: index * 0.05 }}
			className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
				isCurrentUser 
					? 'border-purple-500 bg-purple-50' 
					: 'border-gray-200 bg-white hover:border-gray-300'
			}`}
		>
			<div className="flex items-center space-x-4 rtl:space-x-reverse">
				<div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getRankColor(entry.rank)}`}>
					{typeof getRankIcon(entry.rank) === 'string' ? (
						<span className="text-sm font-bold">{getRankIcon(entry.rank)}</span>
					) : (
						getRankIcon(entry.rank)
					)}
				</div>
				<div>
					<h3 className="font-semibold text-gray-900 flex items-center">
						{entry.username}
						{isCurrentUser && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">You</span>}
					</h3>
					<p className="text-sm text-gray-600">
						{entry.gamesPlayed || 0} games • {entry.successRate.toFixed(1)}% success
					</p>
				</div>
			</div>
			<div className="text-right">
				<p className="text-lg font-bold text-gray-900">{entry.score.toLocaleString()}</p>
				<p className="text-sm text-gray-600">points</p>
				{entry.gamesPlayed && entry.gamesPlayed > 0 && (
					<p className="text-xs text-orange-600 flex items-center">
						<Icon name="gamepad" size="xs" color="warning" className="mr-1" />
						{entry.gamesPlayed} games
					</p>
				)}
			</div>
		</motion.div>
	);
}

