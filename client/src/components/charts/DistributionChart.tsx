import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatForDisplay } from '@shared/utils';

import type { DistributionChartProps } from '@/types';
import { ChartCard } from './ChartCard';

export function DistributionChart({
	data,
	comparisonData,
	isLoading,
	height = 300,
	xAxisLabel = 'Category',
	yAxisLabel = 'Amount',
	valueLabel = 'Value',
	countLabel = 'Count',
	className,
	color = 'hsl(var(--primary))',
	comparisonColor = 'hsl(var(--muted-foreground) / 0.5)',
}: DistributionChartProps) {
	const chartData = useMemo(() => {
		if (!data || data.length === 0) return [];

		const baseData = data
			.map(item => {
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
			})
			.sort((a, b) => b.value - a.value);

		// Add comparison data if provided
		if (comparisonData && comparisonData.length > 0) {
			const comparisonMap = new Map(comparisonData.map(item => [item.name, item.value]));
			baseData.forEach(item => {
				const comparisonValue = comparisonMap.get(item.fullName);
				if (comparisonValue !== undefined) {
					item.comparisonValue = comparisonValue;
				}
			});
		}

		return baseData;
	}, [data, comparisonData]);

	const isEmpty = !isLoading && (!data || data.length === 0);

	return (
		<ChartCard
			title='Distribution'
			description={`${xAxisLabel} by ${yAxisLabel}`}
			isLoading={isLoading}
			isEmpty={isEmpty}
			emptyMessage='No data available'
			className={className}
		>
			<ResponsiveContainer width='100%' height={height}>
				<BarChart
					data={chartData}
					margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
					style={{ direction: 'ltr' }}
					barCategoryGap='15%'
				>
					<CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--muted-foreground) / 0.2)' />
					<XAxis
						dataKey='name'
						stroke='hsl(var(--muted-foreground))'
						style={{ fontSize: '12px' }}
						angle={-45}
						textAnchor='end'
						height={80}
						label={{ value: xAxisLabel, position: 'insideBottom', offset: -5 }}
					/>
					<YAxis
						stroke='hsl(var(--primary))'
						style={{ fontSize: '12px' }}
						label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
					/>
					<Tooltip
						contentStyle={{
							direction: 'rtl',
							backgroundColor: 'hsl(var(--card))',
							border: '1px solid hsl(var(--border))',
							borderRadius: '8px',
						}}
						labelFormatter={value => {
							const point = chartData.find(p => p.name === value);
							return point?.fullName ?? value;
						}}
						formatter={(value: number, name: string) => {
							if (name === 'value') {
								return [formatForDisplay(value), valueLabel];
							}
							if (name === 'comparisonValue') {
								return [formatForDisplay(value), 'Global Average'];
							}
							if (name === 'count') {
								return [formatForDisplay(value, 0), countLabel];
							}
							return [formatForDisplay(value), name];
						}}
					/>
					{comparisonData && comparisonData.length > 0 && (
						<Bar
							dataKey='comparisonValue'
							fill={comparisonColor}
							radius={[8, 8, 0, 0]}
							name='comparisonValue'
							barSize={30}
						/>
					)}
					<Bar dataKey='value' fill={color} radius={[8, 8, 0, 0]} name='value' barSize={30} />
				</BarChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}
