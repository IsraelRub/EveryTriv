import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { GamepadIcon, Medal, PercentCircle, UserCheck } from 'lucide-react';

import { LeaderboardPeriod } from '@shared/constants';
import { formatNumericValue } from '@shared/utils';
import { isLeaderboardPeriod } from '@shared/validation';

import { Colors, LEADERBOARD_PERIOD_PARAM, StatisticsLeaderboardKey } from '@/constants';
import { Card, LeaderboardTable, SectionCard, StatCard, Tabs } from '@/components';
import { SecondaryTabsBar } from '@/components/layout';
import {
	useAppDispatch,
	useAppSelector,
	useGlobalLeaderboard,
	useLeaderboardByPeriod,
	useLeaderboardStats,
} from '@/hooks';
import { selectLeaderboardPeriod } from '@/redux/selectors';
import { setLeaderboardPeriod } from '@/redux/slices';

export function LeaderboardTabContent() {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const [searchParams, setSearchParams] = useSearchParams();
	const leaderboardTab = useAppSelector(selectLeaderboardPeriod);
	const { data: globalData, isLoading: globalLoading } = useGlobalLeaderboard();
	const { data: weeklyData, isLoading: weeklyLoading } = useLeaderboardByPeriod(LeaderboardPeriod.WEEKLY);
	const { data: leaderboardStats, isLoading: leaderboardStatsLoading } = useLeaderboardStats(leaderboardTab);

	const globalEntries = Array.isArray(globalData) ? globalData : [];
	const weeklyEntries = Array.isArray(weeklyData) ? weeklyData : [];

	useEffect(() => {
		const param = searchParams.get(LEADERBOARD_PERIOD_PARAM);
		if (param != null && isLeaderboardPeriod(param)) {
			dispatch(setLeaderboardPeriod(param));
			return;
		}
		const next = new URLSearchParams(searchParams);
		next.set(LEADERBOARD_PERIOD_PARAM, leaderboardTab);
		setSearchParams(next, { replace: true });
	}, [dispatch, leaderboardTab, searchParams, setSearchParams]);

	const handlePeriodChange = (value: string) => {
		if (!isLeaderboardPeriod(value)) return;
		dispatch(setLeaderboardPeriod(value));
		const next = new URLSearchParams(searchParams);
		next.set(LEADERBOARD_PERIOD_PARAM, value);
		setSearchParams(next);
	};

	const leaderboardPeriodItems = [
		{ value: LeaderboardPeriod.GLOBAL, label: t(StatisticsLeaderboardKey.ALL_TIME) },
		{ value: LeaderboardPeriod.WEEKLY, label: t(StatisticsLeaderboardKey.THIS_WEEK) },
	];

	return (
		<div className='space-y-8'>
			<Tabs value={leaderboardTab} onValueChange={handlePeriodChange} className='w-full'>
				<SecondaryTabsBar items={leaderboardPeriodItems} columns={2} />

				<SectionCard
					title={t(StatisticsLeaderboardKey.TITLE)}
					icon={Medal}
					description={
						leaderboardTab === LeaderboardPeriod.GLOBAL
							? t(StatisticsLeaderboardKey.DESCRIPTION_GLOBAL)
							: t(StatisticsLeaderboardKey.DESCRIPTION_PERIOD)
					}
				>
					<div className='grid grid-cols-1 lg:grid-cols-[minmax(0,260px)_1fr] gap-6 items-stretch'>
						<div className='flex flex-col gap-4'>
							<StatCard
								icon={UserCheck}
								label={t(StatisticsLeaderboardKey.ACTIVE_USERS)}
								value={formatNumericValue(leaderboardStats?.activeUsers, 0)}
								color={Colors.BLUE_500.text}
								isLoading={leaderboardStatsLoading}
							/>
							<StatCard
								icon={PercentCircle}
								label={t(StatisticsLeaderboardKey.AVERAGE_SCORE)}
								value={formatNumericValue(leaderboardStats?.averageScore, 0)}
								color={Colors.YELLOW_500.text}
								isLoading={leaderboardStatsLoading}
							/>
							<StatCard
								icon={GamepadIcon}
								label={t(StatisticsLeaderboardKey.AVERAGE_GAMES)}
								value={formatNumericValue(leaderboardStats?.averageGames, 0)}
								color={Colors.GREEN_500.text}
								isLoading={leaderboardStatsLoading}
							/>
						</div>
						<div className='min-h-0 flex flex-col'>
							<p className='text-sm font-medium text-muted-foreground mb-3'>
								{leaderboardTab === LeaderboardPeriod.GLOBAL
									? t(StatisticsLeaderboardKey.GLOBAL_RANKING)
									: t(StatisticsLeaderboardKey.WEEKLY_RANKING)}
							</p>
							<Card className='flex-1 min-h-0 overflow-auto border-border/50 bg-background/50 p-2'>
								<LeaderboardTable
									entries={leaderboardTab === LeaderboardPeriod.GLOBAL ? globalEntries : weeklyEntries}
									isLoading={leaderboardTab === LeaderboardPeriod.GLOBAL ? globalLoading : weeklyLoading}
								/>
							</Card>
						</div>
					</div>
				</SectionCard>
			</Tabs>
		</div>
	);
}
