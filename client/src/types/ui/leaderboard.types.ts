/**
 * Leaderboard Component Types
 * @module LeaderboardComponentTypes
 * @description UI component prop types for leaderboard and ranking components
 */
import { ReactNode } from 'react';

import type { LeaderboardEntry } from '@shared/types';

import { MetricColor, TrendDirection } from '@/constants';

/**
 * Card Metric Props Interface
 * @interface CardMetricProps
 * @description Common props for metric cards (ranking, analytics, etc.)
 */
export interface CardMetricProps {
	title: string;
	value: string;
	subtitle: string;
	icon: ReactNode;
	color: MetricColor;
	trend?: TrendDirection;
}

/**
 * Leaderboard Entry Component Props
 * @interface LeaderboardEntryProps
 * @description Props for the LeaderboardEntry component
 * @used_by client/src/views/leaderboard
 */
export interface LeaderboardEntryProps {
	entry: LeaderboardEntry;
	isCurrentUser: boolean;
}
