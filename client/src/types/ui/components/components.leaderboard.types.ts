/**
 * Leaderboard Component Types
 * @module LeaderboardComponentTypes
 * @description UI component prop types for leaderboard and ranking components
 */
import { ReactNode } from 'react';

import type { LeaderboardEntry } from '@shared/types';

/**
 * Card Metric Props Interface
 * @interface CardMetricProps
 * @description Common props for metric cards (ranking, analytics, etc.)
 */
export interface CardMetricProps {
	title: string;
	value: string;
	subtitle: string;
	icon: ReactNode | string;
	color: 'yellow' | 'blue' | 'green' | 'purple' | 'red';
	trend?: 'up' | 'down' | 'neutral';
}

/**
 * Ranking Card Component Props
 * @interface RankingCardProps
 * @description Props for the RankingCard component used in leaderboard
 * @used_by client/src/views/leaderboard
 */
export interface RankingCardProps extends CardMetricProps {}

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
