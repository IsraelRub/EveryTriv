import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatForDisplay } from '@shared/utils';
import type { TrendChartProps } from '@/types';
import { ChartCard } from './ChartCard';

/**
 * Line chart component for displaying user trends over time
 * Shows score and optionally success rate
 */
export function TrendChart({ data, isLoading, height = 300, showSuccessRate = true, className }: TrendChartProps) {
	const chartData = useMemo(() => {
		if (!data || data.length === 0) return [];

		return data.map(point => ({
			date: new Date(point.date).toLocaleDateString(undefined, {
				day: '2-digit',
				month: '2-digit',
			}),
			fullDate: point.date,
			score: point.score,
			successRate: Math.round(point.successRate),
		}));
	}, [data]);

	const isEmpty = !isLoading && (!data || data.length === 0);

	return (
		<ChartCard
			title='Performance Trends'
			description='Score and success rate over time'
			isLoading={isLoading}
			isEmpty={isEmpty}
			emptyMessage='No trend data available. Play games to see your progress'
			className={className}
		>
			<ResponsiveContainer width='100%' height={height}>
				<LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ direction: 'ltr' }}>
					<CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--muted-foreground) / 0.2)' />
					<XAxis
						dataKey='date'
						stroke='hsl(var(--muted-foreground))'
						style={{ fontSize: '12px' }}
						angle={-45}
						textAnchor='end'
						height={60}
					/>
					<YAxis
						yAxisId='score'
						stroke='hsl(var(--primary))'
						style={{ fontSize: '12px' }}
						label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
					/>
					{showSuccessRate && (
						<YAxis
							yAxisId='successRate'
							orientation='right'
							stroke='hsl(var(--color-success-500))'
							style={{ fontSize: '12px' }}
							domain={[0, 100]}
							label={{ value: 'Success Rate (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
						/>
					)}
					<Tooltip
						contentStyle={{
							direction: 'rtl',
							backgroundColor: 'hsl(var(--card))',
							border: '1px solid hsl(var(--border))',
							borderRadius: '8px',
						}}
						labelFormatter={value => {
							const point = chartData.find(p => p.date === value);
							if (point) {
								return new Date(point.fullDate).toLocaleDateString(undefined, {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
								});
							}
							return value;
						}}
						formatter={(value: number, name: string) => {
							if (name === 'score') {
								return [formatForDisplay(value, 0), 'Score'];
							}
							if (name === 'successRate') {
								return [formatForDisplay(value), 'Success Rate'];
							}
							return [formatForDisplay(value), name];
						}}
					/>
					<Legend
						wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }}
						formatter={value => {
							if (value === 'score') return 'Score';
							if (value === 'successRate') return 'Success Rate';
							return value;
						}}
					/>
					<Line
						type='monotone'
						dataKey='score'
						yAxisId='score'
						stroke='hsl(var(--primary))'
						strokeWidth={2}
						dot={{ r: 4 }}
						activeDot={{ r: 6 }}
						name='score'
					/>
					{showSuccessRate && (
						<Line
							type='monotone'
							dataKey='successRate'
							yAxisId='successRate'
							stroke='hsl(var(--color-success-500))'
							strokeWidth={2}
							dot={{ r: 4 }}
							activeDot={{ r: 6 }}
							name='successRate'
						/>
					)}
				</LineChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}
