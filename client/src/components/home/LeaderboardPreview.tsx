import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';

import { HomeKey, ViewAllDestination } from '@/constants';
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
	const { t } = useTranslation('home');
	const { data: globalData, isLoading } = useGlobalLeaderboard();
	const topPlayers = Array.isArray(globalData) ? globalData.slice(0, 5) : [];

	return (
		<Card className='h-full flex flex-col'>
			<CardHeader className='flex flex-row items-center justify-between pb-2'>
				<div className='space-y-1'>
					<CardTitle className='text-xl flex items-center gap-2'>
						<Trophy className='w-5 h-5 text-primary' />
						{t(HomeKey.TOP_PLAYERS)}
					</CardTitle>
					<CardDescription>{t(HomeKey.TOP_PLAYERS_DESC)}</CardDescription>
				</div>
				<ViewAllButton destination={ViewAllDestination.LEADERBOARD} visible={topPlayers.length > 0} />
			</CardHeader>
			<CardContent className='flex min-h-[22rem] flex-1 flex-col'>
				<LeaderboardTable entries={topPlayers} isLoading={isLoading} fillEmptyStateHeight={true} />
			</CardContent>
		</Card>
	);
}
