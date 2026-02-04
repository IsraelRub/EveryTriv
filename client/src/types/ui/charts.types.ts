import type { ReactNode } from 'react';

import type { UserTrendPoint } from '@shared/types';

import type { DifficultyStats, TopicData } from './stats.types';

export interface PieChartCenterText {
	primary: string;
	secondary?: string;
}

export interface ChartDataPoint {
	name: string;
	value: number;
	count?: number;
}

export interface DistributionTooltipPoint {
	fullName: string;
	value: number;
	count: number;
	comparisonValue?: number;
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
	className?: string;
	hideCard?: boolean;
	centerText?: string | PieChartCenterText;
	emptyStateData?: string;
}

export interface TrendChartProps {
	data?: UserTrendPoint[];
	isLoading?: boolean;
	height?: number;
	showSuccessRate?: boolean;
	xAxisLabel?: string;
	scoreLabel?: string;
	successRateLabel?: string;
	className?: string;
	hideCard?: boolean;
	emptyStateData?: string;
}

export interface DistributionChartProps {
	data?: ChartDataPoint[];
	comparisonData?: ChartDataPoint[];
	isLoading?: boolean;
	height?: number;
	xAxisLabel?: string;
	yAxisLabel?: string;
	valueLabel?: string;
	countLabel?: string;
	className?: string;
	color?: string;
	comparisonColor?: string;
	hideCard?: boolean;
	emptyStateData?: string;
	isPercentage?: boolean;
}

export interface ChartCardProps {
	title: string;
	description?: string;
	isLoading?: boolean;
	data?: unknown[] | null | undefined;
	children: ReactNode;
	className?: string;
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
	className?: string;
}

export interface DifficultyDistributionChartProps {
	difficultyData?: Record<string, DifficultyStats | undefined>;
	totalGames?: number;
	isLoading?: boolean;
	height?: number;
	maxItems?: number;
	minPercentage?: number;
	centerText?: string | PieChartCenterText;
	className?: string;
	showSuccessRate?: boolean;
}

export interface DifficultyOverviewChartProps {
	difficultyData?: Record<string, DifficultyStats | undefined>;
	height?: number;
	valueLabel?: string;
}

export interface MetricsPieChartProps {
	data?: ChartDataPoint[];
	isLoading?: boolean;
	height?: number;
	className?: string;
	maxItems?: number;
	minPercentage?: number;
}

export interface StackedBarDataPoint {
	name: string;
	success: number;
	failure: number;
}

export interface StackedBarChartProps {
	data?: StackedBarDataPoint[];
	isLoading?: boolean;
	height?: number;
	xAxisLabel?: string;
	yAxisLabel?: string;
	successLabel?: string;
	failureLabel?: string;
	className?: string;
	successColor?: string;
	failureColor?: string;
	hideCard?: boolean;
	emptyStateData?: string;
}
