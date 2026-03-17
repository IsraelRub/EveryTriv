import { memo, useMemo } from 'react';

import { formatTitle, sumBy } from '@shared/utils';

import { CHART_COLORS, CHART_HEIGHTS } from '@/constants';
import type { ChartDataPoint, TopicsDistributionChartProps } from '@/types';
import { PieChart } from '@/components';

export const TopicsDistributionChart = memo(function TopicsDistributionChart({
	topicsData,
	isLoading,
	height = CHART_HEIGHTS.LARGE,
	maxItems = 8,
	minPercentage = 1,
	valueLabel = 'Games Played',
	centerText,
	centerPrimaryLabel,
	className,
}: TopicsDistributionChartProps) {
	const effectiveMinPercentage = minPercentage === 0 ? undefined : minPercentage;
	const rawData: ChartDataPoint[] = useMemo(() => {
		if (!topicsData || topicsData.length === 0) return [];
		return topicsData.map(topic => ({
			name: formatTitle(topic.topic),
			value: topic.totalGames,
		}));
	}, [topicsData]);

	const totalGames = useMemo(() => sumBy(rawData, item => item.value), [rawData]);

	const defaultCenterText = useMemo(
		() =>
			centerText ?? {
				primary: centerPrimaryLabel ?? 'Total Games',
				secondary: totalGames.toLocaleString(),
			},
		[centerText, centerPrimaryLabel, totalGames]
	);

	return (
		<PieChart
			data={rawData}
			height={height}
			maxItems={maxItems}
			minPercentage={effectiveMinPercentage}
			valueLabel={valueLabel}
			colors={CHART_COLORS}
			hideCard
			centerText={defaultCenterText}
			className={className}
			isLoading={isLoading}
		/>
	);
});
