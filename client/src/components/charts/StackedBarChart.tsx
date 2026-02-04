import { memo, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatForDisplay } from '@shared/utils';

import { CHART_HEIGHTS, CssColor } from '@/constants';
import { EmptyState, Skeleton } from '@/components';
import type { StackedBarChartProps } from '@/types';
import { toHslColor } from '@/utils';
import { ChartCard } from './ChartCard';

export const StackedBarChart = memo(function StackedBarChart({
	data,
	isLoading,
	height = CHART_HEIGHTS.DEFAULT,
	xAxisLabel = 'Category',
	yAxisLabel = 'Count',
	successLabel = 'Success',
	failureLabel = 'Failure',
	className,
	successColor = toHslColor(CssColor.SUCCESS_500),
	failureColor = toHslColor(CssColor.DESTRUCTIVE),
	hideCard = false,
	emptyStateData,
}: StackedBarChartProps) {
	const chartData = useMemo(() => {
		if (!data || data.length === 0) return [];

		return data.map(item => ({
			name: item.name,
			success: item.success ?? 0,
			failure: item.failure ?? 0,
			total: (item.success ?? 0) + (item.failure ?? 0),
		}));
	}, [data]);

	const chartContent = (
		<ResponsiveContainer width='100%' height={height}>
			<BarChart
				data={chartData}
				layout='vertical'
				margin={{ top: 5, right: 30, left: 10, bottom: 30 }}
				style={{ direction: 'ltr' }}
				barCategoryGap='20%'
			>
				<CartesianGrid strokeDasharray='3 3' stroke={toHslColor(CssColor.MUTED_FOREGROUND, 0.2)} horizontal={false} />
				<XAxis
					type='number'
					stroke={toHslColor(CssColor.MUTED_FOREGROUND)}
					style={{ fontSize: '12px' }}
					label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 10 } : undefined}
				/>
				<YAxis
					dataKey='name'
					type='category'
					width={100}
					stroke={toHslColor(CssColor.PRIMARY)}
					style={{ fontSize: '12px' }}
					tick={{ fill: toHslColor(CssColor.FOREGROUND) }}
					label={
						yAxisLabel
							? { value: yAxisLabel, angle: -90, position: 'left', style: { textAnchor: 'middle' } }
							: undefined
					}
				/>
				<Tooltip
					cursor={{ fill: toHslColor(CssColor.MUTED, 0.2), radius: 4 }}
					contentStyle={{
						direction: 'rtl',
						backgroundColor: toHslColor(CssColor.CARD),
						border: `1px solid ${toHslColor(CssColor.BORDER)}`,
						borderRadius: '8px',
					}}
					formatter={(value: number, name: string) => {
						if (name === 'success') {
							return [formatForDisplay(value, 0), successLabel];
						}
						if (name === 'failure') {
							return [formatForDisplay(value, 0), failureLabel];
						}
						if (name === 'total') {
							return [formatForDisplay(value, 0), 'Total'];
						}
						return [formatForDisplay(value, 0), name];
					}}
				/>
				<Legend
					wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }}
					formatter={value => {
						if (value === 'success') return successLabel;
						if (value === 'failure') return failureLabel;
						return value;
					}}
				/>
				<Bar dataKey='success' stackId='a' fill={successColor} radius={[0, 0, 0, 0]} name='success' />
				<Bar dataKey='failure' stackId='a' fill={failureColor} radius={[4, 4, 0, 0]} name='failure' />
			</BarChart>
		</ResponsiveContainer>
	);

	if (hideCard) {
		if (isLoading) {
			return <Skeleton className={className} style={{ height: `${height}px` }} />;
		}
		if (emptyStateData && (!data || data.length === 0)) {
			return (
				<div className={className}>
					<EmptyState data={emptyStateData} />
				</div>
			);
		}
		return <div className={className}>{chartContent}</div>;
	}

	return (
		<ChartCard
			title='Stacked Bar Chart'
			description={`${xAxisLabel} by ${yAxisLabel}`}
			isLoading={isLoading}
			data={data}
			className={className}
		>
			{chartContent}
		</ChartCard>
	);
});
