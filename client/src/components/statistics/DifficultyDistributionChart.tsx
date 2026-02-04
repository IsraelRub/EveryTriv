import { memo } from 'react';

import { GameDifficulty } from '@shared/types';
import { isGameDifficulty } from '@shared/validation';

import { CHART_COLORS, CHART_HEIGHTS } from '@/constants';
import { PieChart } from '@/components';
import type { ChartDataPoint, DifficultyDistributionChartProps } from '@/types';
import { calculateChartDataSum } from '@/utils';

export const DifficultyDistributionChart = memo(function DifficultyDistributionChart({
	difficultyData,
	totalGames,
	isLoading,
	height = CHART_HEIGHTS.LARGE,
	maxItems = 10,
	minPercentage = 1, // Default: group items below 1% as "Others"
	centerText,
	className,
	showSuccessRate = false,
}: DifficultyDistributionChartProps) {
	// Allow disabling minPercentage by passing 0 or undefined explicitly
	const effectiveMinPercentage = minPercentage === 0 ? undefined : minPercentage;
	const pieData: ChartDataPoint[] = [];
	if (difficultyData && Object.keys(difficultyData).length > 0) {
		for (const [difficulty, stats] of Object.entries(difficultyData)) {
			if (isGameDifficulty(difficulty) && stats) {
				const gameDifficulty: GameDifficulty = difficulty;
				pieData.push({
					name: gameDifficulty,
					value: showSuccessRate ? (stats.successRate ?? 0) : stats.total,
				});
			}
		}
	}

	const calculatedTotal = totalGames ?? calculateChartDataSum(pieData);
	const defaultCenterText = centerText || {
		primary: showSuccessRate ? 'Avg Success' : 'Total Games',
		secondary: showSuccessRate ? `${(calculatedTotal / pieData.length).toFixed(1)}%` : calculatedTotal.toLocaleString(),
	};

	return (
		<PieChart
			data={pieData}
			height={height}
			maxItems={maxItems}
			minPercentage={effectiveMinPercentage}
			colors={CHART_COLORS}
			hideCard
			centerText={defaultCenterText}
			className={className}
			isLoading={isLoading}
		/>
	);
});
