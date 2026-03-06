import { Trophy } from 'lucide-react';

import { ViewAllDestination } from '@/constants';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	LeaderboardTable,
	ViewAllButton,
} from '@/components';
import { useGlobalLeaderboard } from '@/hooks';

export function LeaderboardPreview() {
	const { data: globalData, isLoading } = useGlobalLeaderboard();
	const topPlayers = Array.isArray(globalData) ? globalData.slice(0, 5) : [];

	return (
		<Card className='h-full flex flex-col'>
			<CardHeader className='flex flex-row items-center justify-between pb-2'>
				<div className='space-y-1'>
					<CardTitle className='text-xl flex items-center gap-2'>
						<Trophy className='w-5 h-5 text-primary' />
						Top Players
					</CardTitle>
					<CardDescription>Global leaders this week</CardDescription>
				</div>
				<ViewAllButton destination={ViewAllDestination.LEADERBOARD} visible={topPlayers.length > 0} />
			</CardHeader>
			<CardContent className='flex-1'>
				<LeaderboardTable entries={topPlayers} isLoading={isLoading} />
			</CardContent>
		</Card>
	);
}
