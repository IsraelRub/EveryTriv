import { GamepadIcon, Medal, Percent, Users } from 'lucide-react';

import { LeaderboardPeriod } from '@shared/constants';
import { formatNumericValue } from '@shared/utils';
import { isLeaderboardPeriod } from '@shared/validation';

import { Colors } from '@/constants';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	LeaderboardTable,
	StatCard,
	Tabs,
	TabsList,
	TabsTrigger,
} from '@/components';
import {
	useAppDispatch,
	useAppSelector,
	useGlobalLeaderboard,
	useLeaderboardByPeriod,
	useLeaderboardStats,
} from '@/hooks';
import { selectLeaderboardPeriod } from '@/redux/selectors';
import { setLeaderboardPeriod } from '@/redux/slices';

export function StatisticsLeaderboardTab() {
	const dispatch = useAppDispatch();
	const leaderboardTab = useAppSelector(selectLeaderboardPeriod);
	const { data: globalData, isLoading: globalLoading } = useGlobalLeaderboard();
	const { data: weeklyData, isLoading: weeklyLoading } = useLeaderboardByPeriod(LeaderboardPeriod.WEEKLY);
	const { data: leaderboardStats, isLoading: leaderboardStatsLoading } = useLeaderboardStats(leaderboardTab);

	const globalEntries = Array.isArray(globalData) ? globalData : [];
	const weeklyEntries = Array.isArray(weeklyData) ? weeklyData : [];

	return (
		<div className='space-y-8'>
			<Tabs
				value={leaderboardTab}
				onValueChange={value => {
					if (isLeaderboardPeriod(value)) {
						dispatch(setLeaderboardPeriod(value));
					}
				}}
				className='w-full'
			>
				<TabsList className='grid w-full grid-cols-2 mb-6'>
					<TabsTrigger value={LeaderboardPeriod.GLOBAL}>All Time</TabsTrigger>
					<TabsTrigger value={LeaderboardPeriod.WEEKLY}>This Week</TabsTrigger>
				</TabsList>

				<Card className='card-muted-tint'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Medal className='h-5 w-5 text-primary' />
							Leaderboard
						</CardTitle>
						<CardDescription>
							{leaderboardTab === LeaderboardPeriod.GLOBAL
								? 'See how you rank against other players • All-time statistics'
								: 'See how you rank against other players • Statistics for the selected period'}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 lg:grid-cols-[minmax(0,260px)_1fr] gap-6 items-stretch'>
							<div className='flex flex-col gap-4'>
								<StatCard
									icon={Users}
									label='Active Users'
									value={formatNumericValue(leaderboardStats?.activeUsers, 0)}
									color={Colors.BLUE_500.text}
									isLoading={leaderboardStatsLoading}
								/>
								<StatCard
									icon={Percent}
									label='Average Score'
									value={formatNumericValue(leaderboardStats?.averageScore, 0)}
									color={Colors.YELLOW_500.text}
									isLoading={leaderboardStatsLoading}
								/>
								<StatCard
									icon={GamepadIcon}
									label='Average Games'
									value={formatNumericValue(leaderboardStats?.averageGames, 0)}
									color={Colors.GREEN_500.text}
									isLoading={leaderboardStatsLoading}
								/>
							</div>
							<div className='min-h-0 flex flex-col'>
								<p className='text-sm font-medium text-muted-foreground mb-3'>
									{leaderboardTab === LeaderboardPeriod.GLOBAL ? 'Global' : 'Weekly'} ranking
								</p>
								<div className='flex-1 min-h-0 overflow-auto rounded-lg border border-border/50 bg-background/50 p-2'>
									<LeaderboardTable
										entries={leaderboardTab === LeaderboardPeriod.GLOBAL ? globalEntries : weeklyEntries}
										isLoading={leaderboardTab === LeaderboardPeriod.GLOBAL ? globalLoading : weeklyLoading}
									/>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</Tabs>
		</div>
	);
}
