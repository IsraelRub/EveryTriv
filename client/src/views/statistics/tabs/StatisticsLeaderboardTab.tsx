import { Activity, BarChart3, GamepadIcon, Trophy } from 'lucide-react';

import { LeaderboardPeriod } from '@shared/constants';
import { isLeaderboardPeriod } from '@shared/validation';

import { BgColor } from '@/constants';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	LeaderboardTable,
	StatCard,
	Tabs,
	TabsContent,
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
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BarChart3 className='h-5 w-5' />
						Leaderboard Statistics ({leaderboardTab === LeaderboardPeriod.GLOBAL ? 'Global' : leaderboardTab})
					</CardTitle>
					<CardDescription>See how you rank against other players • Statistics for the selected period</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						<StatCard
							icon={Activity}
							label='Active Users'
							value={leaderboardStats?.activeUsers ?? 0}
							color={BgColor.BLUE_500}
							countUp
							isLoading={leaderboardStatsLoading}
						/>
						<StatCard
							icon={Trophy}
							label='Average Score'
							value={Math.round(leaderboardStats?.averageScore ?? 0)}
							color={BgColor.YELLOW_500}
							countUp
							isLoading={leaderboardStatsLoading}
						/>
						<StatCard
							icon={GamepadIcon}
							label='Average Games'
							value={leaderboardStats?.averageGames ?? 0}
							color={BgColor.GREEN_500}
							countUp
							isLoading={leaderboardStatsLoading}
						/>
					</div>
				</CardContent>
			</Card>

			<Tabs
				value={leaderboardTab}
				onValueChange={value => {
					if (isLeaderboardPeriod(value)) {
						dispatch(setLeaderboardPeriod(value));
					}
				}}
				className='w-full'
			>
				<TabsList className='grid w-full grid-cols-2'>
					<TabsTrigger value={LeaderboardPeriod.GLOBAL}>All Time</TabsTrigger>
					<TabsTrigger value={LeaderboardPeriod.WEEKLY}>This Week</TabsTrigger>
				</TabsList>
				<TabsContent value={LeaderboardPeriod.GLOBAL} className='mt-6'>
					<Card className='border-muted bg-muted/20'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Trophy className='h-5 w-5 text-yellow-500' />
								Global Leaderboard
							</CardTitle>
						</CardHeader>
						<CardContent className='overflow-hidden'>
							<LeaderboardTable entries={globalEntries} isLoading={globalLoading} />
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value={LeaderboardPeriod.WEEKLY} className='mt-6'>
					<Card className='border-muted bg-muted/20'>
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
	);
}
