import { memo } from 'react';

import { CHART_HEIGHTS } from '@/constants';
import { PieChart } from '@/components';
import type { ChartDataPoint, MetricsPieChartProps } from '@/types';
import { calculateChartDataSum } from '@/utils';

export const MetricsPieChart = memo(function MetricsPieChart({
	data,
	isLoading,
	height = CHART_HEIGHTS.SMALL,
	className,
	maxItems = 10,
	minPercentage = 1, // Default: group items below 1% as "Others"
}: MetricsPieChartProps) {
	// Allow disabling minPercentage by passing 0 or undefined explicitly
	const effectiveMinPercentage = minPercentage === 0 ? undefined : minPercentage;
	const pieData: ChartDataPoint[] =
		data && data.length > 0
			? data.map(item => ({
					name: item.name,
					value: item.value,
				}))
			: [];

	const total = calculateChartDataSum(data ?? []);
	const centerText = {
		primary: 'Total',
		secondary: `${total.toFixed(0)}%`,
	};

	return (
		<PieChart
			data={pieData}
			height={height}
			maxItems={maxItems}
			minPercentage={effectiveMinPercentage}
			hideCard
			className={className}
			centerText={centerText}
			isLoading={isLoading}
		/>
	);
});
