import type { DifficultyStats, UserTrendPoint } from '@shared/types';

import type { TopicData } from './stats.types';

export interface ChartDataPoint {
	name: string;
	value: number;
	count?: number;
}

export interface DifficultyTooltipPoint {
	name: string;
	games: number;
	successRate: number;
}

export interface PieChartProps {
	data?: ChartDataPoint[];
	isLoading?: boolean;
	height?: number;
	colors?: string[];
	maxItems?: number;
	minPercentage?: number;
	valueLabel?: string;
	centerText?: string | PieChartCenterText;
	emptyStateData?: string;
}

export interface TrendChartProps {
	data?: UserTrendPoint[];
	isLoading?: boolean;
	height?: number;
	xAxisLabel?: string;
	scoreLabel?: string;
	successRateLabel?: string;
	emptyStateData?: string;
}

export interface TopicsDistributionChartProps {
	topicsData?: TopicData[];
	isLoading?: boolean;
	height?: number;
	maxItems?: number;
	minPercentage?: number;
	valueLabel?: string;
	centerText?: string | PieChartCenterText;
	centerPrimaryLabel?: string;
}

export interface DifficultyOverviewChartProps {
	difficultyData?: Record<string, DifficultyStats | undefined>;
	height?: number;
	valueLabel?: string;
}
export interface PieChartCenterText {
	primary: string;
	secondary?: string;
}

export interface DistributionTooltipPoint {
	fullName: string;
	value: number;
	count: number;
	comparisonValue?: number;
}
