import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartNoAxesCombined } from 'lucide-react';

import { CHART_HEIGHTS, StatisticsPerformanceKey } from '@/constants';
import type { PerformanceAnalysisProps } from '@/types';
import { SectionCard } from '@/components';
import { PerformanceSkeleton } from '../skeleton';
import { DifficultyOverviewChart } from './DifficultyOverviewChart';

export const PerformanceAnalysis = memo(function PerformanceAnalysis({
	mainData,
	isLoading,
	showPersonalStats = false,
}: PerformanceAnalysisProps) {
	const { t } = useTranslation('statistics');

	if (isLoading) {
		return (
			<div className='space-y-8'>
				<PerformanceSkeleton />
			</div>
		);
	}

	const hasData = mainData && Object.keys(mainData).length > 0;
	if (!hasData) {
		return null;
	}

	return (
		<div className='space-y-8'>
			<SectionCard
				title={
					showPersonalStats
						? t(StatisticsPerformanceKey.YOUR_PERFORMANCE_BY_DIFFICULTY)
						: t(StatisticsPerformanceKey.PERFORMANCE_BY_DIFFICULTY)
				}
				icon={ChartNoAxesCombined}
				description={
					showPersonalStats
						? t(StatisticsPerformanceKey.BAR_LENGTH_QUESTIONS_DESC)
						: t(StatisticsPerformanceKey.BAR_LENGTH_GAMES_DESC)
				}
			>
				<div className='space-y-4'>
					<DifficultyOverviewChart
						difficultyData={mainData}
						height={CHART_HEIGHTS.LARGE}
						valueLabel={
							showPersonalStats
								? t(StatisticsPerformanceKey.QUESTIONS_ANSWERED)
								: t(StatisticsPerformanceKey.GAMES_PLAYED)
						}
					/>
				</div>
			</SectionCard>
		</div>
	);
});
