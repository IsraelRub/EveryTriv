/**
 * Charts Component Types
 *
 * @module ChartsTypes
 * @description Type definitions for chart components
 * @used_by client/src/components/charts/
 */
import type { ReactNode } from 'react';

import type { UserTrendPoint } from '@shared/types';

/**
 * Pie chart data point interface
 * @interface PieChartDataPoint
 * @description Data point for pie chart visualization
 */
export interface PieChartDataPoint {
	name: string;
	value: number;
}

/**
 * Pie chart component props
 * @interface PieChartProps
 * @description Props for the PieChart component
 */
export interface PieChartProps {
	data?: PieChartDataPoint[];
	isLoading?: boolean;
	height?: number;
	colors?: string[];
	maxItems?: number;
	className?: string;
}

/**
 * Trend chart component props
 * @interface TrendChartProps
 * @description Props for the TrendChart component
 */
export interface TrendChartProps {
	data?: UserTrendPoint[];
	isLoading?: boolean;
	height?: number;
	showSuccessRate?: boolean;
	className?: string;
}

/**
 * Distribution chart data point interface
 * @interface DistributionDataPoint
 * @description Data point for distribution chart visualization
 */
export interface DistributionDataPoint {
	name: string;
	value: number;
	count?: number;
}

/**
 * Distribution chart component props
 * @interface DistributionChartProps
 * @description Props for the DistributionChart component
 */
export interface DistributionChartProps {
	data?: DistributionDataPoint[];
	comparisonData?: DistributionDataPoint[];
	isLoading?: boolean;
	height?: number;
	xAxisLabel?: string;
	yAxisLabel?: string;
	valueLabel?: string;
	countLabel?: string;
	className?: string;
	color?: string;
	comparisonColor?: string;
}

/**
 * Chart card component props
 * @interface ChartCardProps
 * @description Props for the ChartCard wrapper component
 */
export interface ChartCardProps {
	title: string;
	description?: string;
	isLoading?: boolean;
	isEmpty?: boolean;
	emptyMessage?: string;
	children: ReactNode;
	className?: string;
}
