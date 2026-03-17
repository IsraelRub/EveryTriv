import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartNoAxesCombined } from 'lucide-react';

import { CHART_HEIGHTS, StatisticsPerformanceKey } from '@/constants';
import type { CategoryAnalysisProps } from '@/types';
import { SectionCard } from '@/components';
import { CategorySkeleton } from '../skeleton';
import { TopicsDistributionChart } from './TopicsDistributionChart';

export const CategoryAnalysis = memo(function CategoryAnalysis({
	topicsData,
	isLoading,
	showPersonalStats = false,
	maxItems = 8,
	minPercentage = 1,
}: CategoryAnalysisProps) {
	const { t } = useTranslation('statistics');
	const effectiveMinPercentage = minPercentage === 0 ? undefined : minPercentage;

	if (isLoading) {
		return (
			<div className='space-y-8'>
				<CategorySkeleton />
			</div>
		);
	}

	if (!topicsData || topicsData.length === 0) {
		return null;
	}

	return (
		<div className='space-y-8'>
			<SectionCard
				title={showPersonalStats ? t(StatisticsPerformanceKey.YOUR_TOPICS) : t(StatisticsPerformanceKey.TOPIC_DETAILS)}
				icon={ChartNoAxesCombined}
				description={
					showPersonalStats
						? t(StatisticsPerformanceKey.QUESTIONS_ANSWERED_PER_TOPIC_DESC)
						: t(StatisticsPerformanceKey.GAMES_PLAYED_PER_TOPIC_DESC)
				}
				contentClassName='overflow-hidden'
			>
				<div className='min-w-0'>
					<TopicsDistributionChart
						topicsData={topicsData}
						maxItems={maxItems}
						minPercentage={effectiveMinPercentage}
						height={CHART_HEIGHTS.LARGE}
						valueLabel={
							showPersonalStats
								? t(StatisticsPerformanceKey.QUESTIONS_ANSWERED)
								: t(StatisticsPerformanceKey.GAMES_PLAYED)
						}
						centerPrimaryLabel={showPersonalStats ? t(StatisticsPerformanceKey.TOTAL_QUESTIONS) : undefined}
					/>
				</div>
			</SectionCard>
		</div>
	);
});
