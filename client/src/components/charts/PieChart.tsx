import { memo, useMemo } from 'react';
import { Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { formatForDisplay } from '@shared/utils';

import { CHART_COLORS, CHART_HEIGHTS, CssColor } from '@/constants';
import { EmptyState, Skeleton } from '@/components';
import type { PieChartProps } from '@/types';
import { isPieTooltipEntry, processChartDataWithOthers, toHslColor } from '@/utils';
import { ChartCard } from './ChartCard';

export const PieChart = memo(function PieChart({
	data,
	isLoading,
	height = CHART_HEIGHTS.DEFAULT,
	colors = CHART_COLORS,
	maxItems = 10,
	minPercentage = 1, // Default: group items below 1% as "Others"
	valueLabel = 'Count',
	className,
	hideCard = false,
	centerText,
	emptyStateData,
}: PieChartProps) {
	// Allow disabling minPercentage by passing 0 or undefined explicitly
	const effectiveMinPercentage = minPercentage === 0 ? undefined : minPercentage;
	const chartData = useMemo(
		() => processChartDataWithOthers(data ?? [], maxItems, effectiveMinPercentage),
		[data, maxItems, effectiveMinPercentage]
	);
	const total = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData]);

	const chartContent = (
		<ResponsiveContainer width='100%' height={height}>
			<RechartsPieChart>
				<Pie
					data={chartData}
					cx='50%'
					cy='50%'
					innerRadius={50}
					outerRadius={85}
					labelLine={false}
					label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
					fill={toHslColor(CssColor.PRIMARY)}
					dataKey='value'
					stroke='none'
				>
					{chartData.map((_, index) => (
						<Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
					))}
				</Pie>
				<Tooltip
					contentStyle={{
						direction: 'rtl',
						backgroundColor: toHslColor(CssColor.CARD),
						border: `1px solid ${toHslColor(CssColor.BORDER)}`,
						borderRadius: '8px',
					}}
					content={({ active, payload }) => {
						if (!active || !payload?.length) return null;
						const raw = payload[0];
						if (raw === undefined) return null;
						const entry = raw.payload ?? raw;
						if (!isPieTooltipEntry(entry)) return null;
						const value = entry.value;
						const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
						return (
							<div className='px-3 py-2 space-y-1'>
								<div className='font-medium'>{entry.name}</div>
								<div className='text-muted-foreground text-sm space-y-0.5'>
									<div>
										{valueLabel}: {formatForDisplay(value, 0)}
									</div>
									<div>Percentage: {pct}%</div>
								</div>
							</div>
						);
					}}
				/>
				<Legend wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }} formatter={value => value} />
				{centerText && (
					<text
						x='50%'
						y='50%'
						textAnchor='middle'
						dominantBaseline='middle'
						className='fill-foreground'
						style={{ fontSize: '16px', fontWeight: 'bold' }}
					>
						{typeof centerText === 'string' ? (
							<tspan x='50%' dy='0' textAnchor='middle'>
								{centerText}
							</tspan>
						) : (
							<>
								<tspan x='50%' dy='-8' textAnchor='middle' style={{ fontSize: '18px', fontWeight: 'bold' }}>
									{centerText.primary}
								</tspan>
								{centerText.secondary && (
									<tspan
										x='50%'
										dy='16'
										textAnchor='middle'
										style={{ fontSize: '12px', fontWeight: 'normal', fill: toHslColor(CssColor.MUTED_FOREGROUND) }}
									>
										{centerText.secondary}
									</tspan>
								)}
							</>
						)}
					</text>
				)}
			</RechartsPieChart>
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
			description='Breakdown by categories'
			isLoading={isLoading}
			data={data}
			className={className}
		>
			{chartContent}
		</ChartCard>
	);
});
