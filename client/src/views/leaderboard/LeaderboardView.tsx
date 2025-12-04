import { useState } from 'react';

import { motion } from 'framer-motion';
import { Crown, Medal, Trophy, User } from 'lucide-react';

import type { LeaderboardEntry } from '@shared/types';

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/components';
import { useGlobalLeaderboard, useLeaderboardByPeriod, useUserRanking } from '@/hooks';

function LeaderboardSkeleton() {
	return (
		<div className='space-y-3'>
			{[...Array(5)].map((_, i) => (
				<div key={i} className='flex items-center gap-4 p-3'>
					<Skeleton className='h-8 w-8 rounded-full' />
					<Skeleton className='h-10 w-10 rounded-full' />
					<div className='flex-1 space-y-2'>
						<Skeleton className='h-4 w-32' />
						<Skeleton className='h-3 w-20' />
					</div>
					<Skeleton className='h-6 w-16' />
				</div>
			))}
		</div>
	);
}

function RankBadge({ rank }: { rank: number }) {
	switch (rank) {
		case 1:
			return <Crown className='h-6 w-6 text-yellow-500' />;
		case 2:
			return <Medal className='h-6 w-6 text-gray-400' />;
		case 3:
			return <Medal className='h-6 w-6 text-amber-600' />;
		default:
			return <span className='text-lg font-bold text-muted-foreground w-6 text-center'>{rank}</span>;
	}
}

function LeaderboardTable({ entries, isLoading }: { entries: LeaderboardEntry[]; isLoading: boolean }) {
	if (isLoading) {
		return <LeaderboardSkeleton />;
	}

	if (!entries || entries.length === 0) {
		return (
			<div className='text-center py-8 text-muted-foreground'>
				<Trophy className='h-12 w-12 mx-auto mb-4 opacity-50' />
				<p>No leaderboard data available yet</p>
			</div>
		);
	}

	return (
		<div className='space-y-2'>
			{entries.map((entry, index) => (
				<motion.div
					key={entry.userId}
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: index * 0.05 }}
					className={`flex items-center gap-4 p-3 rounded-lg ${
						index < 3 ? 'bg-muted/50' : 'hover:bg-muted/30'
					} transition-colors`}
				>
					<RankBadge rank={entry.rank} />
					<Avatar className='h-10 w-10'>
						<AvatarImage src={entry.avatar} alt={entry.firstName || entry.email} />
						<AvatarFallback>{entry.firstName?.charAt(0) || entry.email.charAt(0).toUpperCase()}</AvatarFallback>
					</Avatar>
					<div className='flex-1 min-w-0'>
						<p className='font-medium truncate'>
							{entry.firstName && entry.lastName ? `${entry.firstName} ${entry.lastName}` : entry.email.split('@')[0]}
						</p>
						<p className='text-sm text-muted-foreground'>
							{entry.gamesPlayed} games • {Math.round(entry.successRate)}% success
						</p>
					</div>
					<div className='text-right'>
						<p className='font-bold text-lg'>{entry.score.toLocaleString()}</p>
						<p className='text-xs text-muted-foreground'>points</p>
					</div>
				</motion.div>
			))}
		</div>
	);
}

export function LeaderboardView() {
	const [activeTab, setActiveTab] = useState('global');

	const { data: globalData, isLoading: globalLoading } = useGlobalLeaderboard();
	const { data: weeklyData, isLoading: weeklyLoading } = useLeaderboardByPeriod('weekly');
	const { data: userRanking, isLoading: rankLoading } = useUserRanking();

	const globalEntries = globalData || [];
	const weeklyEntries = weeklyData || [];

	return (
		<motion.main
			role='main'
			aria-label='Leaderboard'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className='min-h-screen py-12 px-4'
		>
			<div className='max-w-4xl mx-auto space-y-8'>
				<div className='text-center'>
					<h1 className='text-4xl font-bold mb-2'>Leaderboards</h1>
					<p className='text-muted-foreground'>See how you rank against other players</p>
				</div>

				{/* User Ranking Card */}
				{userRanking && (
					<Card className='border-primary/50'>
						<CardHeader className='pb-3'>
							<CardTitle className='text-lg flex items-center gap-2'>
								<User className='h-5 w-5' />
								Your Ranking
							</CardTitle>
						</CardHeader>
						<CardContent>
							{rankLoading ? (
								<div className='flex items-center gap-4'>
									<Skeleton className='h-12 w-12 rounded-full' />
									<div className='space-y-2'>
										<Skeleton className='h-6 w-24' />
										<Skeleton className='h-4 w-32' />
									</div>
								</div>
							) : (
								<div className='flex items-center gap-4'>
									<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
										<span className='text-2xl font-bold text-primary'>#{userRanking.rank}</span>
									</div>
									<div>
										<p className='text-2xl font-bold'>{userRanking.score?.toLocaleString() || 0} pts</p>
										<p className='text-sm text-muted-foreground'>
											Top {Math.round(userRanking.percentile || 0)}% of {userRanking.totalUsers || 0} players
										</p>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
					<TabsList className='grid w-full grid-cols-2'>
						<TabsTrigger value='global'>All Time</TabsTrigger>
						<TabsTrigger value='weekly'>This Week</TabsTrigger>
					</TabsList>
					<TabsContent value='global' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Trophy className='h-5 w-5 text-yellow-500' />
									Global Leaderboard
								</CardTitle>
							</CardHeader>
							<CardContent>
								<LeaderboardTable entries={globalEntries} isLoading={globalLoading} />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value='weekly' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Trophy className='h-5 w-5 text-blue-500' />
									Weekly Leaderboard
								</CardTitle>
							</CardHeader>
							<CardContent>
								<LeaderboardTable entries={weeklyEntries} isLoading={weeklyLoading} />
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</motion.main>
	);
}
