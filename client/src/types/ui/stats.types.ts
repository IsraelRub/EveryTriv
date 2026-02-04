import { type ElementType } from 'react';

import type { LeaderboardEntry } from '@shared/types';

import { BgColor, Easing, StatCardVariant, TextColor } from '@/constants';

export interface UseCountUpOptions {
	duration?: number;
	enabled?: boolean;
	easing?: Easing;
	/** When this value changes, the count-up animation restarts from 0 to target (e.g. after refresh). */
	resetTrigger?: unknown;
}

export interface StatCardProps {
	icon: ElementType;
	label: string;
	value: string | number;
	subtext?: string;
	color: TextColor | BgColor;
	suffix?: string;
	trend?: string;
	trendUp?: boolean;
	isLoading?: boolean;
	variant?: StatCardVariant;
	animate?: boolean;
	countUp?: boolean;
	countUpDuration?: number;
	/** When provided (or from RefreshAnimationContext), count-up restarts on change (e.g. after header refresh). */
	countUpResetTrigger?: unknown;
}

export interface RankBadgeProps {
	rank: number;
}

export interface GameStatsCardProps {
	gameStats?: {
		totalGames?: number;
		successRate?: number;
		bestScore?: number;
		totalPlayTime?: number;
		correctAnswers?: number;
		totalQuestionsAnswered?: number;
	};
	performanceStats?: {
		streakDays?: number;
	};
	variant?: StatCardVariant;
	showStreak?: boolean;
	showPlayTime?: boolean;
	className?: string;
	title?: string;
	description?: string;
	titleIcon?: ElementType;
	showViewFullStatsButton?: boolean;
	onViewFullStats?: () => void;
	isLoading?: boolean;
}

export interface LeaderboardTableProps {
	entries: LeaderboardEntry[];
	isLoading: boolean;
}

export interface TopicData {
	topic: string;
	totalGames: number;
}

export interface DifficultyStats {
	successRate?: number;
	total: number;
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
