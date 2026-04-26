import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatDate, formatNumericValue, mean } from '@shared/utils';

import {
	CHART_HEIGHTS,
	CommonKey,
	CssColor,
	SkeletonVariant,
	StatisticsPerformanceKey,
	TREND_CHART_DATA_KEYS,
	UiDensity,
} from '@/constants';
import type { TrendChartProps } from '@/types';
import { formatDateShort } from '@/utils';
import { EmptyState, Skeleton } from '@/components';

export const TrendChart = memo(function TrendChart({
	data,
	isLoading,
	height = CHART_HEIGHTS.DEFAULT,
	xAxisLabel,
	scoreLabel,
	successRateLabel,
	emptyStateData,
}: TrendChartProps) {
	const { t: tStat } = useTranslation('statistics');
	const { t: tCommon } = useTranslation('common');
	const resolvedScoreLabel = scoreLabel ?? tStat(StatisticsPerformanceKey.SCORE_LABEL);
	const resolvedSuccessRateLabel = successRateLabel ?? tStat(StatisticsPerformanceKey.SUCCESS_RATE_PERCENT_LABEL);
	const chartData = useMemo(() => {
		if (!data?.length) return [];

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

	if (isLoading) {
		return <Skeleton variant={SkeletonVariant.Chart} style={{ height: `${height}px` }} />;
	}
	if (!data?.length) {
		if (emptyStateData) {
			return <EmptyState data={emptyStateData} density={UiDensity.COMPACT} />;
		}
		return (
			<div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
				<p>{tCommon(CommonKey.NO_DATA_AVAILABLE)}</p>
			</div>
		);
	}
	return (
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
					yAxisId={TREND_CHART_DATA_KEYS.SCORE}
					stroke={CssColor.PRIMARY}
					style={{ fontSize: '12px' }}
					label={{ value: resolvedScoreLabel, angle: -90, position: 'left', style: { textAnchor: 'middle' } }}
				/>
				<YAxis
					yAxisId={TREND_CHART_DATA_KEYS.SUCCESS_RATE}
					orientation='right'
					stroke={CssColor.SUCCESS_500}
					style={{ fontSize: '12px' }}
					domain={[0, 100]}
					label={{ value: resolvedSuccessRateLabel, angle: 90, position: 'right', style: { textAnchor: 'middle' } }}
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
						if (name === TREND_CHART_DATA_KEYS.SCORE) {
							return [formatNumericValue(value, 0), resolvedScoreLabel];
						}
						if (name === TREND_CHART_DATA_KEYS.SUCCESS_RATE) {
							return [formatNumericValue(value), resolvedSuccessRateLabel];
						}
						return [formatNumericValue(value), name];
					}}
				/>
				<Legend
					wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }}
					formatter={value => {
						if (value === TREND_CHART_DATA_KEYS.SCORE) return resolvedScoreLabel;
						if (value === TREND_CHART_DATA_KEYS.SUCCESS_RATE) return resolvedSuccessRateLabel;
						return value;
					}}
				/>
				<Line
					type='monotone'
					dataKey={TREND_CHART_DATA_KEYS.SCORE}
					yAxisId={TREND_CHART_DATA_KEYS.SCORE}
					stroke={CssColor.PRIMARY}
					strokeWidth={2}
					dot={{ r: 4 }}
					activeDot={{ r: 6 }}
					name={TREND_CHART_DATA_KEYS.SCORE}
				/>
				<Line
					type='monotone'
					dataKey={TREND_CHART_DATA_KEYS.SUCCESS_RATE}
					yAxisId={TREND_CHART_DATA_KEYS.SUCCESS_RATE}
					stroke={CssColor.SUCCESS_500}
					strokeWidth={2}
					dot={{ r: 4 }}
					activeDot={{ r: 6 }}
					name={TREND_CHART_DATA_KEYS.SUCCESS_RATE}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
});
