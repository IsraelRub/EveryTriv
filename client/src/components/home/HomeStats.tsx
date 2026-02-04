import { Trophy } from 'lucide-react';

import { StatCardVariant } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, GameStatsCard, Skeleton } from '@/components';
import { useUserAnalytics } from '@/hooks';
import { hasNoGames } from '@/utils';

export function HomeStats() {
	const { data: analytics, isLoading } = useUserAnalytics();
	const gameStats = analytics?.game;
	const performanceStats = analytics?.performance;

	if (isLoading) {
		return (
			<Card className='border-primary/20 bg-primary/5'>
				<CardHeader>
					<Skeleton className='h-6 w-32' />
					<Skeleton className='h-4 w-48 mt-2' />
				</CardHeader>
				<CardContent>
					<Skeleton className='h-10 w-40' />
				</CardContent>
			</Card>
		);
	}

	if (hasNoGames(gameStats)) {
		return (
			<Card className='border-primary/20 bg-primary/5'>
				<CardHeader>
					<CardTitle className='text-xl flex items-center gap-2'>
						<Trophy className='h-5 w-5 text-primary' />
						Your Overview
					</CardTitle>
					<CardDescription>Track your progress and achievements</CardDescription>
				</CardHeader>
				<CardContent>
					<EmptyState data='your statistics and progress' />
				</CardContent>
			</Card>
		);
	}

	return (
		<GameStatsCard
			gameStats={gameStats}
			performanceStats={performanceStats}
			variant={StatCardVariant.CENTERED}
			showStreak
			className='border-primary/20 bg-primary/5'
			title='Your Overview'
			description='Your quick stats at a glance'
			titleIcon={Trophy}
			isLoading={isLoading}
		/>
	);
}
