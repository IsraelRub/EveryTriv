import { useMemo } from 'react';
import { Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { formatForDisplay } from '@shared/utils';
import type { PieChartProps } from '@/types';
import { ChartCard } from './ChartCard';

const DEFAULT_COLORS = [
	'hsl(var(--primary))',
	'hsl(var(--color-success-500))',
	'hsl(var(--color-warning-500))',
	'hsl(var(--destructive))',
	'hsl(var(--muted-foreground))',
	'hsl(var(--accent))',
	'hsl(var(--chart-1))',
	'hsl(var(--chart-2))',
	'hsl(var(--chart-3))',
	'hsl(var(--chart-4))',
	'hsl(var(--chart-5))',
];

/**
 * Pie chart component for displaying proportional data (topics distribution, etc.)
 */
export function PieChart({
	data,
	isLoading,
	height = 300,
	colors = DEFAULT_COLORS,
	maxItems = 10,
	className,
}: PieChartProps) {
	const chartData = useMemo(() => {
		if (!data || data.length === 0) return [];

		const sorted = [...data].sort((a, b) => b.value - a.value);
		const topItems = sorted.slice(0, maxItems);
		const othersSum = sorted.slice(maxItems).reduce((sum, item) => sum + item.value, 0);

		if (othersSum > 0) {
			return [
				...topItems,
				{
					name: 'Others',
					value: othersSum,
				},
			];
		}

		return topItems;
	}, [data, maxItems]);

	const isEmpty = !isLoading && (!data || data.length === 0);

	return (
		<ChartCard
			title='Distribution'
			description='Breakdown by categories'
			isLoading={isLoading}
			isEmpty={isEmpty}
			emptyMessage='No data available'
			className={className}
		>
			<ResponsiveContainer width='100%' height={height}>
				<RechartsPieChart>
					<Pie
						data={chartData}
						cx='50%'
						cy='50%'
						labelLine={false}
						label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
						outerRadius={80}
						fill='hsl(var(--primary))'
						dataKey='value'
					>
						{chartData.map((_, index) => (
							<Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
						))}
					</Pie>
					<Tooltip
						contentStyle={{
							direction: 'rtl',
							backgroundColor: 'hsl(var(--card))',
							border: '1px solid hsl(var(--border))',
							borderRadius: '8px',
						}}
						formatter={(value: number) => [formatForDisplay(value, 0), 'Count']}
					/>
					<Legend wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }} formatter={value => value} />
				</RechartsPieChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}
