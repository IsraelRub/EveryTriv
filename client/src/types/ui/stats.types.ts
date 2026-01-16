import { type ElementType } from 'react';

import type { GameDifficulty, LeaderboardEntry } from '@shared/types';

import { BgColor, Easing, StatCardVariant, TextColor } from '@/constants';

export interface UseCountUpOptions {
	duration?: number;
	enabled?: boolean;
	easing?: Easing;
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
}

export interface TopicBarProps {
	topic: string;
	count: number;
	maxCount: number;
}

export interface DifficultyBarProps {
	difficulty: GameDifficulty;
	successRate: number;
	gamesPlayed: number;
	color: string;
	globalSuccessRate?: number;
}

export interface RankBadgeProps {
	rank: number;
}

export interface LeaderboardTableProps {
	entries: LeaderboardEntry[];
	isLoading: boolean;
}
