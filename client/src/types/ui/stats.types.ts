import { type ElementType } from 'react';

import type { GameDifficulty, LeaderboardEntry } from '@shared/types';

import { BgColor, Easing, StatCardVariant, TextColor } from '@/constants';

/**
 * Statistics Component Types
 * @module StatsComponentTypes
 * @description UI component prop types for statistics and user data components
 */

/**
 * Configuration options for the count-up animation
 */
export interface UseCountUpOptions {
	duration?: number;
	enabled?: boolean;
	easing?: Easing;
}

/**
 * Stat Card Component Props
 * @interface StatCardProps
 * @description Props for the StatCard component used in statistics views
 * Supports multiple layout variants and optional features
 */
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
}

/**
 * Topic Bar Component Props
 * @interface TopicBarProps
 * @description Props for the TopicBar component displaying topic statistics
 */
export interface TopicBarProps {
	topic: string;
	count: number;
	maxCount: number;
}

/**
 * Difficulty Bar Component Props
 * @interface DifficultyBarProps
 * @description Props for the DifficultyBar component displaying difficulty performance
 */
export interface DifficultyBarProps {
	difficulty: GameDifficulty;
	successRate: number;
	gamesPlayed: number;
	color: string;
	globalSuccessRate?: number;
}

/**
 * Rank Badge Component Props
 * @interface RankBadgeProps
 * @description Props for the RankBadge component displaying user rank
 */
export interface RankBadgeProps {
	rank: number;
}

/**
 * Leaderboard Table Component Props
 * @interface LeaderboardTableProps
 * @description Props for the LeaderboardTable component displaying leaderboard entries
 */
export interface LeaderboardTableProps {
	entries: LeaderboardEntry[];
	isLoading: boolean;
}
