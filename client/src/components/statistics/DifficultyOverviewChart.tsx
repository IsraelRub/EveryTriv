import { memo, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatDifficulty, formatNumericValue } from '@shared/utils';
import { isGameDifficulty } from '@shared/validation';

import { CHART_HEIGHTS, CssColor } from '@/constants';
import type { DifficultyOverviewChartProps } from '@/types';
import { getBarColorBySuccessRate, isDifficultyTooltipPoint } from '@/utils';

export const DifficultyOverviewChart = memo(function DifficultyOverviewChart({
	difficultyData,
	height = CHART_HEIGHTS.LARGE,
	valueLabel = 'Games Played',
}: DifficultyOverviewChartProps) {
	const chartData = useMemo(() => {
		if (!difficultyData || Object.keys(difficultyData).length === 0) return [];

		return Object.entries(difficultyData)
			.filter(([difficulty]) => isGameDifficulty(difficulty))
			.map(([difficulty, stats]) => {
				if (!isGameDifficulty(difficulty) || !stats) return null;
				return {
					name: formatDifficulty(difficulty),
					games: stats.total,
					successRate: stats.successRate ?? 0,
				};
			})
			.filter((item): item is { name: string; games: number; successRate: number } => item !== null)
			.sort((a, b) => b.games - a.games);
	}, [difficultyData]);

	if (chartData.length === 0) return null;

	return (
		<ResponsiveContainer width='100%' height={height}>
			<BarChart
				data={chartData}
				layout='vertical'
				margin={{ top: 5, right: 30, left: 10, bottom: 30 }}
				style={{ direction: 'ltr' }}
				barCategoryGap='20%'
			>
				<CartesianGrid strokeDasharray='3 3' stroke={CssColor.MUTED_FOREGROUND_20} horizontal={false} />
				<XAxis
					type='number'
					stroke={CssColor.MUTED_FOREGROUND}
					style={{ fontSize: '12px' }}
					label={{ value: valueLabel, position: 'bottom', offset: 10 }}
				/>
				<YAxis
					dataKey='name'
					type='category'
					width={100}
					stroke={CssColor.PRIMARY}
					style={{ fontSize: '12px' }}
					tick={{ fill: CssColor.FOREGROUND }}
					label={{ value: 'Difficulty', angle: -90, position: 'left', style: { textAnchor: 'middle' } }}
				/>
				<Tooltip
					cursor={{ fill: CssColor.MUTED_20, radius: 4 }}
					contentStyle={{
						direction: 'rtl',
						backgroundColor: CssColor.CARD,
						border: `1px solid ${CssColor.BORDER}`,
						borderRadius: '8px',
					}}
					content={({ active, payload }) => {
						if (!active || !payload?.length) return null;
						const first = payload[0];
						if (!first?.payload || !isDifficultyTooltipPoint(first.payload)) return null;
						const point = first.payload;
						return (
							<div className='px-3 py-2 space-y-1'>
								<div className='font-medium'>{point.name}</div>
								<div className='text-muted-foreground text-sm space-y-0.5'>
									<div>
										{valueLabel}: {formatNumericValue(point.games, 0)}
									</div>
									<div>Success Rate: {formatNumericValue(point.successRate, 2, '%')}</div>
								</div>
							</div>
						);
					}}
				/>
				<Bar dataKey='games' radius={[0, 4, 4, 0]} barSize={24}>
					{chartData.map((entry, index) => (
						<Cell key={`cell-${index}`} fill={getBarColorBySuccessRate(entry.successRate)} />
					))}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
});
