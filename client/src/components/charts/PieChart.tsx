import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { calculatePercentage, formatNumericValue, isRecord, sumBy } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { CHART_COLORS, CHART_HEIGHTS, CommonKey, CssColor, OTHERS_LABEL, SkeletonVariant } from '@/constants';
import type { ChartDataPoint, PieChartProps } from '@/types';
import { EmptyState, Skeleton } from '@/components';
import { ChartCard } from './ChartCard';

export const PieChart = memo(function PieChart({
	data,
	isLoading,
	height = CHART_HEIGHTS.DEFAULT,
	colors = CHART_COLORS,
	maxItems = 10,
	minPercentage = 1,
	valueLabel,
	className,
	hideCard = false,
	centerText,
	emptyStateData,
}: PieChartProps) {
	const { t } = useTranslation();
	const effectiveMinPercentage = minPercentage === 0 ? undefined : minPercentage;
	const chartData = useMemo(() => {
		if (!(data ?? []).length) return [];
		const raw = data ?? [];
		const sorted = [...raw].sort((a, b) => b.value - a.value);
		let existingOthersSum = 0;
		const mainItems = sorted.filter(item => {
			if (item.name === OTHERS_LABEL) {
				existingOthersSum += item.value;
				return false;
			}
			return true;
		});
		const totalSum = sumBy(mainItems, item => item.value) + existingOthersSum;
		let itemsToShow: ChartDataPoint[];
		let othersData: ChartDataPoint[];
		if (effectiveMinPercentage !== undefined && effectiveMinPercentage > 0) {
			const minValue = (totalSum * effectiveMinPercentage) / 100;
			othersData = [];
			itemsToShow = mainItems.filter(item => {
				if (item.value < minValue) {
					othersData.push(item);
					return false;
				}
				return true;
			});
		} else {
			itemsToShow = mainItems;
			othersData = [];
		}
		const topItems = itemsToShow.slice(0, maxItems);
		const remainingItems = itemsToShow.slice(maxItems);
		othersData = [...othersData, ...remainingItems];
		const othersSum = sumBy(othersData, item => item.value) + existingOthersSum;
		if (othersSum > 0) {
			return [...topItems, { name: OTHERS_LABEL, value: othersSum }];
		}
		return topItems;
	}, [data, maxItems, effectiveMinPercentage]);
	const total = useMemo(() => sumBy(chartData, item => item.value), [chartData]);

	const chartContent = (
		<ResponsiveContainer width='100%' height={height}>
			<RechartsPieChart>
				<Pie
					data={chartData}
					cx='50%'
					cy='50%'
					innerRadius={50}
					outerRadius={85}
					labelLine={{ stroke: CssColor.PRIMARY, strokeWidth: 2 }}
					label={({ name, percent }) => `${name}: ${formatNumericValue(calculatePercentage(percent, 1), 1, '%')}`}
					fill={CssColor.PRIMARY}
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
						backgroundColor: CssColor.CARD,
						border: `1px solid ${CssColor.BORDER}`,
						borderRadius: '8px',
					}}
					content={({ active, payload }) => {
						if (!active || !payload?.length) return null;
						const payloadItem = payload[0];
						if (payloadItem === undefined) return null;
						const entry = payloadItem.payload ?? payloadItem;
						if (!isRecord(entry)) return null;
						const name = Object.getOwnPropertyDescriptor(entry, 'name')?.value;
						const value = Object.getOwnPropertyDescriptor(entry, 'value')?.value;
						if (!VALIDATORS.string(name) || !VALIDATORS.number(value)) return null;
						const pct = formatNumericValue(calculatePercentage(value, total, false), 1, '%');
						return (
							<div className='px-3 py-2 space-y-1'>
								<div className='font-medium'>{name}</div>
								<div className='text-muted-foreground text-sm space-y-0.5'>
									<div>
										{valueLabel}: {formatNumericValue(value, 0)}
									</div>
									<div>
										{t(CommonKey.PERCENTAGE)}: {pct}
									</div>
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
										style={{ fontSize: '12px', fontWeight: 'normal', fill: CssColor.MUTED_FOREGROUND }}
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
			title={t(CommonKey.DISTRIBUTION)}
			description={t(CommonKey.BREAKDOWN_BY_CATEGORIES)}
			isLoading={isLoading}
			data={data}
			className={className}
		>
			{chartContent}
		</ChartCard>
	);
});
