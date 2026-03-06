import { type ElementType } from 'react';

import type { DifficultyStats, LeaderboardEntry } from '@shared/types';

import { Easing, StatCardVariant } from '@/constants';

export type { DifficultyStats };

export interface UseCountUpOptions {
	duration?: number;
	enabled?: boolean;
	easing?: Easing;

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
}

export interface StatsSectionCardProps {
	title?: string;
	description?: string;
	titleIcon?: ElementType;
	stats: StatCardProps[];
	variant?: StatCardVariant;
	gridCols?: string;
	isLoading?: boolean;
	className?: string;
}

export type AdminGameStatFormat = 'integer' | 'decimal' | 'percent';

export type AdminGameStatKey =
	| 'totalGames'
	| 'bestScore'
	| 'averageScore'
	| 'accuracy'
	| 'activePlayers24h'
	| 'totalQuestionsAnswered';

export type AdminGameStatSpec = Omit<StatCardProps, 'value'> & {
	key: AdminGameStatKey;
	format: AdminGameStatFormat;
};

export interface LeaderboardTableProps {
	entries: LeaderboardEntry[];
	isLoading: boolean;
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
