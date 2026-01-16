import type { ReactNode } from 'react';

import type { UserTrendPoint } from '@shared/types';

export interface PieChartDataPoint {
	name: string;
	value: number;
}

export interface PieChartProps {
	data?: PieChartDataPoint[];
	isLoading?: boolean;
	height?: number;
	colors?: string[];
	maxItems?: number;
	className?: string;
}

export interface TrendChartProps {
	data?: UserTrendPoint[];
	isLoading?: boolean;
	height?: number;
	showSuccessRate?: boolean;
	className?: string;
}

export interface DistributionDataPoint {
	name: string;
	value: number;
	count?: number;
}

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

export interface ChartCardProps {
	title: string;
	description?: string;
	isLoading?: boolean;
	isEmpty?: boolean;
	emptyMessage?: string;
	children: ReactNode;
	className?: string;
}
