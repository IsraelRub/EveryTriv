import { useMemo } from 'react';
import { Activity, GamepadIcon, Timer, TrendingUp } from 'lucide-react';

import { TIME_DURATIONS_SECONDS } from '@shared/constants';
import { formatNumericValue } from '@shared/utils';

import { ADMIN_GAME_STATS_SPEC, Colors } from '@/constants';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CategoryAnalysis,
	PerformanceAnalysis,
	PlatformTrendsSection,
	StatCard,
	StatsSectionCard,
} from '@/components';
import { useGameStatistics, useGlobalDifficultyStats, useGlobalStats, usePopularTopics } from '@/hooks';
import type { StatCardProps } from '@/types';

export function AdminPerformanceTab() {
	const { data: globalStats, isLoading: statsLoading } = useGlobalStats(true);
	const { data: globalDifficultyStats, isLoading: difficultyLoading } = useGlobalDifficultyStats();
	const { data: gameStatistics, isLoading: gameStatisticsLoading } = useGameStatistics();
	const { data: topicsData, isLoading: topicsLoading } = usePopularTopics();

	const adminGameStats = useMemo((): StatCardProps[] => {
		const data = gameStatistics;
		return ADMIN_GAME_STATS_SPEC.map(spec => ({
			icon: spec.icon,
			label: spec.label,
			color: spec.color,
			value:
				spec.format === 'percent'
					? formatNumericValue(data?.[spec.key], 2, '%')
					: spec.format === 'decimal'
						? formatNumericValue(data?.[spec.key], 2)
						: formatNumericValue(data?.[spec.key], 0),
		}));
	}, [gameStatistics]);

	const platformStats = [
		{
			icon: GamepadIcon,
			label: 'Average Games',
			value: globalStats?.averageGames ?? 0,
			color: Colors.GREEN_500.text,
		},
		{
			icon: Timer,
			label: 'Average Game Time',
			value: Math.round((globalStats?.averageGameTime ?? 0) / TIME_DURATIONS_SECONDS.MINUTE),
			suffix: 'm',
			color: Colors.YELLOW_500.text,
		},
		{
			icon: TrendingUp,
			label: 'Consistency',
			value: globalStats?.consistency ?? 0,
			suffix: '%',
			color: Colors.PURPLE_500.text,
		},
	];

	return (
		<>
			<Card className='card-muted-tint'>
				<CardHeader>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<Activity className='h-5 w-5 text-primary' />
							Platform Overview
						</CardTitle>
						<CardDescription>Real-time platform metrics</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						{platformStats.map(stat => (
							<StatCard key={stat.label} {...stat} isLoading={statsLoading} />
						))}
					</div>
				</CardContent>
			</Card>
			<StatsSectionCard
				title='Game Statistics'
				description='Overview of game metrics. See Topics and Performance tabs for distribution charts.'
				titleIcon={GamepadIcon}
				stats={adminGameStats}
				gridCols='grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
				isLoading={gameStatisticsLoading}
			/>
			<PlatformTrendsSection statsLoading={statsLoading} />
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
				<PerformanceAnalysis mainData={globalDifficultyStats} isLoading={difficultyLoading} />
				<CategoryAnalysis topicsData={topicsData?.topics} isLoading={topicsLoading} />
			</div>
		</>
	);
}
