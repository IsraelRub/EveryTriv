import { memo, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatForDisplay } from '@shared/utils';

import { CHART_HEIGHTS, CssColor } from '@/constants';
import { EmptyState, Skeleton } from '@/components';
import type { DistributionChartProps } from '@/types';
import { isDistributionTooltipPoint, sortChartDataByValue, toHslColor } from '@/utils';
import { ChartCard } from './ChartCard';

export const DistributionChart = memo(function DistributionChart({
	data,
	comparisonData,
	isLoading,
	height = CHART_HEIGHTS.DEFAULT,
	xAxisLabel = 'Value',
	yAxisLabel = 'Category',
	valueLabel = 'Value',
	countLabel = 'Count',
	className,
	color = toHslColor(CssColor.PRIMARY),
	comparisonColor = toHslColor(CssColor.MUTED_FOREGROUND, 0.5),
	hideCard = false,
	emptyStateData,
	isPercentage = false,
}: DistributionChartProps) {
	const chartData = useMemo(() => {
		if (!data || data.length === 0) return [];

		const baseData = data.map(item => {
			const result: {
				name: string;
				fullName: string;
				value: number;
				count: number;
				comparisonValue?: number;
			} = {
				name: item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name,
				fullName: item.name,
				value: item.value,
				count: item.count ?? item.value,
			};
			return result;
		});

		// Sort by value using the utility function
		const sortedBaseData = sortChartDataByValue(data).map(sortedItem => {
			const originalItem = baseData.find(item => item.fullName === sortedItem.name);
			return originalItem!;
		});

		// Add comparison data if provided
		if (comparisonData && comparisonData.length > 0) {
			const comparisonMap = new Map(comparisonData.map(item => [item.name, item.value]));
			sortedBaseData.forEach(item => {
				const comparisonValue = comparisonMap.get(item.fullName);
				if (comparisonValue !== undefined) {
					item.comparisonValue = comparisonValue;
				}
			});
		}

		return sortedBaseData;
	}, [data, comparisonData]);

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
					label={
						xAxisLabel || valueLabel ? { value: xAxisLabel || valueLabel, position: 'bottom', offset: 10 } : undefined
					}
					domain={isPercentage ? [0, 100] : undefined}
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
					content={({ active, payload, label }) => {
						if (!active || !payload?.length) return null;
						const first = payload[0];
						if (!first?.payload || !isDistributionTooltipPoint(first.payload)) return null;
						const point = first.payload;
						const displayLabel = point.fullName ?? label;
						return (
							<div className='px-3 py-2 space-y-1'>
								<div className='font-medium'>{displayLabel}</div>
								<div className='text-muted-foreground text-sm space-y-0.5'>
									<div>
										{valueLabel}: {formatForDisplay(point.value)}
										{isPercentage ? '%' : ''}
									</div>
									{point.count !== point.value && (
										<div>
											{countLabel}: {formatForDisplay(point.count, 0)}
										</div>
									)}
									{point.comparisonValue !== undefined && (
										<div>
											Global Average: {formatForDisplay(point.comparisonValue)}
											{isPercentage ? '%' : ''}
										</div>
									)}
								</div>
							</div>
						);
					}}
				/>
				{comparisonData && comparisonData.length > 0 && (
					<Bar
						dataKey='comparisonValue'
						fill={comparisonColor}
						radius={[0, 4, 4, 0]}
						name='comparisonValue'
						barSize={20}
					/>
				)}
				<Bar dataKey='value' fill={color} radius={[0, 4, 4, 0]} name='value' barSize={20} />
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
			title='Distribution'
			description={`${xAxisLabel} by ${yAxisLabel}`}
			isLoading={isLoading}
			data={data}
			className={className}
		>
			{chartContent}
		</ChartCard>
	);
});
