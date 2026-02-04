import { memo, useMemo } from 'react';

import { CHART_COLORS, CHART_HEIGHTS } from '@/constants';
import { PieChart } from '@/components';
import type { ChartDataPoint, TopicsDistributionChartProps } from '@/types';
import { calculateChartDataSum, processChartDataWithOthers } from '@/utils';

export const TopicsDistributionChart = memo(function TopicsDistributionChart({
	topicsData,
	isLoading,
	height = CHART_HEIGHTS.LARGE,
	maxItems = 8,
	minPercentage = 1, // Default: group items below 1% as "Others"
	valueLabel = 'Games Played',
	centerText,
	centerPrimaryLabel,
	className,
}: TopicsDistributionChartProps) {
	// Allow disabling minPercentage by passing 0 or undefined explicitly
	const effectiveMinPercentage = minPercentage === 0 ? undefined : minPercentage;
	const pieData: ChartDataPoint[] = useMemo(() => {
		if (!topicsData || topicsData.length === 0) return [];

		const rawData: ChartDataPoint[] = topicsData.map(topic => ({
			name: topic.topic,
			value: topic.totalGames,
		}));

		return processChartDataWithOthers(rawData, maxItems, effectiveMinPercentage);
	}, [topicsData, maxItems, effectiveMinPercentage]);

	const totalGames = useMemo(() => calculateChartDataSum(pieData), [pieData]);

	const defaultCenterText = useMemo(
		() =>
			centerText || {
				primary: centerPrimaryLabel ?? 'Total Games',
				secondary: totalGames.toLocaleString(),
			},
		[centerText, centerPrimaryLabel, totalGames]
	);

	return (
		<PieChart
			data={pieData}
			height={height}
			maxItems={maxItems}
			valueLabel={valueLabel}
			colors={CHART_COLORS}
			hideCard
			centerText={defaultCenterText}
			className={className}
			isLoading={isLoading}
		/>
	);
});
