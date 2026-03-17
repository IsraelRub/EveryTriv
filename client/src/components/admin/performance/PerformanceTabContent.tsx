import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Binoculars, GamepadIcon, Timer, TrendingUp } from 'lucide-react';

import { TIME_DURATIONS_SECONDS } from '@shared/constants';
import { formatNumericValue } from '@shared/utils';

import { ADMIN_GAME_STATS_SPEC, AdminKey, Colors } from '@/constants';
import { AdminGameStatFormat, type StatCardProps } from '@/types';
import {
	CategoryAnalysis,
	PerformanceAnalysis,
	PlatformTrendsSection,
	SectionCard,
	StatCard,
	StatsSectionCard,
} from '@/components';
import { useGameStatistics, useGlobalDifficultyStats, useGlobalStats, usePopularTopics } from '@/hooks';

export function PerformanceTabContent() {
	const { t } = useTranslation();
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
				spec.format === AdminGameStatFormat.PERCENT
					? formatNumericValue(data?.[spec.key], 2, '%')
					: spec.format === AdminGameStatFormat.DECIMAL
						? formatNumericValue(data?.[spec.key], 2)
						: formatNumericValue(data?.[spec.key], 0),
		}));
	}, [gameStatistics]);

	const platformStats = useMemo(
		() => [
			{
				icon: GamepadIcon,
				label: t(AdminKey.AVERAGE_GAMES),
				value: globalStats?.averageGames ?? 0,
				color: Colors.GREEN_500.text,
			},
			{
				icon: Timer,
				label: t(AdminKey.AVERAGE_GAME_TIME),
				value: Math.round((globalStats?.averageGameTime ?? 0) / TIME_DURATIONS_SECONDS.MINUTE),
				suffix: 'm',
				color: Colors.YELLOW_500.text,
			},
			{
				icon: TrendingUp,
				label: t(AdminKey.CONSISTENCY),
				value: globalStats?.consistency ?? 0,
				suffix: '%',
				color: Colors.PURPLE_500.text,
			},
		],
		[globalStats, t]
	);

	return (
		<>
			<SectionCard
				title={t(AdminKey.PLATFORM_OVERVIEW)}
				icon={Binoculars}
				description={t(AdminKey.PLATFORM_OVERVIEW_DESC)}
			>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
					{platformStats.map(stat => (
						<StatCard key={stat.label} {...stat} isLoading={statsLoading} />
					))}
				</div>
			</SectionCard>
			<StatsSectionCard
				title={t(AdminKey.GAME_STATISTICS)}
				description={t(AdminKey.GAME_STATISTICS_DESC)}
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
