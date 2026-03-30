import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Binoculars, GamepadIcon, Timer, TrendingUp } from 'lucide-react';

import { TIME_DURATIONS_SECONDS } from '@shared/constants';
import { formatNumericValue } from '@shared/utils';

import {
	ADMIN_GAME_STATS_SPEC,
	AdminGameStatFormat,
	AdminKey,
	Colors,
	PerformanceTabAccordion,
	StatsSectionLayout,
} from '@/constants';
import type { StatCardProps } from '@/types';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
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
			<Accordion
				type='multiple'
				defaultValue={[
					PerformanceTabAccordion.GAME_STATS,
					PerformanceTabAccordion.TRENDS,
					PerformanceTabAccordion.CHARTS,
				]}
				className='w-full rounded-lg border bg-card'
			>
				<AccordionItem value={PerformanceTabAccordion.GAME_STATS}>
					<AccordionTrigger className='px-4'>
						<span className='flex items-center gap-2'>
							<GamepadIcon className='h-4 w-4 shrink-0 text-primary' />
							{t(AdminKey.GAME_STATISTICS)}
						</span>
					</AccordionTrigger>
					<AccordionContent className='px-4'>
						<StatsSectionCard
							layout={StatsSectionLayout.PLAIN}
							stats={adminGameStats}
							gridCols='grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
							isLoading={gameStatisticsLoading}
						/>
						<p className='mt-2 text-sm text-muted-foreground'>{t(AdminKey.GAME_STATISTICS_DESC)}</p>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value={PerformanceTabAccordion.TRENDS}>
					<AccordionTrigger className='px-4'>
						<span className='flex items-center gap-2'>
							<TrendingUp className='h-4 w-4 shrink-0 text-primary' />
							{t(AdminKey.PLATFORM_TRENDS)}
						</span>
					</AccordionTrigger>
					<AccordionContent className='px-4'>
						<PlatformTrendsSection statsLoading={statsLoading} embedded />
						<p className='mt-2 text-sm text-muted-foreground'>{t(AdminKey.PLATFORM_TRENDS_DESC)}</p>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value={PerformanceTabAccordion.CHARTS}>
					<AccordionTrigger className='px-4'>{t(AdminKey.DETAILED_PLATFORM_ANALYTICS)}</AccordionTrigger>
					<AccordionContent className='px-4'>
						<div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
							<PerformanceAnalysis mainData={globalDifficultyStats} isLoading={difficultyLoading} />
							<CategoryAnalysis topicsData={topicsData?.topics} isLoading={topicsLoading} />
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</>
	);
}
