import { type ElementType } from 'react';
import type { LucideIcon } from 'lucide-react';

import type { DifficultyStats, LeaderboardEntry } from '@shared/types';

import { AdminGameStatFormat, AdminGameStatKey, StatCardVariant, StatsSectionLayout } from '@/constants';

export interface UseCountUpOptions {
	duration?: number;
	enabled?: boolean;
	resetTrigger?: unknown;
}

export interface StatCardProps {
	icon: ElementType;
	label: string;
	value: string | number;
	subtext?: string;
	color: string;
	suffix?: string;
	trend?: string;
	trendUp?: boolean;
	isLoading?: boolean;
	variant?: StatCardVariant;
	animate?: boolean;

	stackIconLabel?: boolean;

	compact?: boolean;
}

export interface StatsSectionCardProps {
	title?: string;
	description?: string;
	titleIcon?: LucideIcon;
	stats: StatCardProps[];
	variant?: StatCardVariant;
	gridCols?: string;
	isLoading?: boolean;
	className?: string;
	layout?: StatsSectionLayout;
}

export type AdminGameStatSpec = Omit<StatCardProps, 'value'> & {
	key: AdminGameStatKey;
	format: AdminGameStatFormat;
};

export interface LeaderboardTableProps {
	entries: LeaderboardEntry[];
	isLoading: boolean;
	fillEmptyStateHeight?: boolean;
}

export interface TopicData {
	topic: string;
	totalGames: number;
}

export interface PerformanceAnalysisProps {
	mainData?: Record<string, DifficultyStats | undefined>;
	isLoading: boolean;
	showPersonalStats?: boolean;
}

export interface CategoryAnalysisProps {
	topicsData?: TopicData[];
	isLoading: boolean;
	showPersonalStats?: boolean;
	maxItems?: number;
	minPercentage?: number;
}
