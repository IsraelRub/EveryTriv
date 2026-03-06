import { memo, useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatDate, formatNumericValue, mean } from '@shared/utils';

import { CHART_HEIGHTS, CssColor, SkeletonVariant } from '@/constants';
import { EmptyState, Skeleton } from '@/components';
import type { TrendChartProps } from '@/types';
import { formatDateShort } from '@/utils';
import { ChartCard } from './ChartCard';

export const TrendChart = memo(function TrendChart({
	data,
	isLoading,
	height = CHART_HEIGHTS.DEFAULT,
	xAxisLabel,
	scoreLabel = 'Score',
	successRateLabel = 'Success Rate (%)',
	className,
	hideCard = false,
	emptyStateData,
}: TrendChartProps) {
	const chartData = useMemo(() => {
		if (!data || data.length === 0) return [];

		const isoKey = (d: string) => (d || '').substring(0, 10);
		const buckets = new Map<string, { fullDate: string; scores: number[]; successRates: number[] }>();

		const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		for (const point of sorted) {
			const key = isoKey(point.date);
			const bucket = buckets.get(key) ?? {
				fullDate: point.date,
				scores: [],
				successRates: [],
			};
			bucket.scores.push(point.score);
			bucket.successRates.push(Math.round(point.successRate));
			buckets.set(key, bucket);
		}

		return Array.from(buckets.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([dateKey, bucket]) => ({
				dateKey,
				fullDate: bucket.fullDate,
				date: formatDateShort(bucket.fullDate),
				score: bucket.scores.length > 0 ? Math.round(mean(bucket.scores)) : 0,
				successRate: bucket.successRates.length > 0 ? Math.round(mean(bucket.successRates)) : 0,
			}));
	}, [data]);

	const chartContent = (
		<ResponsiveContainer width='100%' height={height}>
			<LineChart data={chartData} margin={{ top: 5, right: 50, left: 50, bottom: 30 }} style={{ direction: 'ltr' }}>
				<CartesianGrid strokeDasharray='3 3' stroke={CssColor.MUTED_FOREGROUND_20} />
				<XAxis
					dataKey='dateKey'
					stroke={CssColor.MUTED_FOREGROUND}
					style={{ fontSize: '12px' }}
					angle={-45}
					textAnchor='end'
					height={60}
					tickFormatter={value => formatDateShort(value)}
					label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
				/>
				<YAxis
					yAxisId='score'
					stroke={CssColor.PRIMARY}
					style={{ fontSize: '12px' }}
					label={{ value: scoreLabel, angle: -90, position: 'left', style: { textAnchor: 'middle' } }}
				/>
				<YAxis
					yAxisId='successRate'
					orientation='right'
					stroke={CssColor.SUCCESS_500}
					style={{ fontSize: '12px' }}
					domain={[0, 100]}
					label={{ value: successRateLabel, angle: 90, position: 'right', style: { textAnchor: 'middle' } }}
				/>
				<Tooltip
					contentStyle={{
						direction: 'rtl',
						backgroundColor: CssColor.CARD,
						border: `1px solid ${CssColor.BORDER}`,
						borderRadius: '8px',
					}}
					labelFormatter={value => {
						const point = chartData.find(p => p.dateKey === value);
						if (point) return formatDate(point.fullDate);
						return formatDate(value);
					}}
					formatter={(value: number, name: string) => {
						if (name === 'score') {
							return [formatNumericValue(value, 0), scoreLabel];
						}
						if (name === 'successRate') {
							return [formatNumericValue(value), successRateLabel];
						}
						return [formatNumericValue(value), name];
					}}
				/>
				<Legend
					wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }}
					formatter={value => {
						if (value === 'score') return scoreLabel;
						if (value === 'successRate') return successRateLabel;
						return value;
					}}
				/>
				<Line
					type='monotone'
					dataKey='score'
					yAxisId='score'
					stroke={CssColor.PRIMARY}
					strokeWidth={2}
					dot={{ r: 4 }}
					activeDot={{ r: 6 }}
					name='score'
				/>
				<Line
					type='monotone'
					dataKey='successRate'
					yAxisId='successRate'
					stroke={CssColor.SUCCESS_500}
					strokeWidth={2}
					dot={{ r: 4 }}
					activeDot={{ r: 6 }}
					name='successRate'
				/>
			</LineChart>
		</ResponsiveContainer>
	);

	if (hideCard) {
		if (isLoading) {
			return <Skeleton variant={SkeletonVariant.Chart} className={className} style={{ height: `${height}px` }} />;
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
			title='Performance Trends'
			description='Score and success rate over time'
			isLoading={isLoading}
			data={data}
			className={className}
		>
			{chartContent}
		</ChartCard>
	);
});
