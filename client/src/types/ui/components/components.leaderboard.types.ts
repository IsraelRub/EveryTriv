/**
 * Leaderboard Component Types
 * @module LeaderboardComponentTypes
 * @description UI component prop types for leaderboard and ranking components
 */
import { ReactNode } from 'react';
import { LeaderboardEntry } from '@shared';

/**
 * Ranking Card Component Props
 * @interface RankingCardProps
 * @description Props for the RankingCard component used in leaderboard
 * @used_by client/src/views/leaderboard/LeaderboardView.tsx
 */
export interface RankingCardProps {
	/** Card title */
	title: string;
	/** Card value */
	value: string;
	/** Card subtitle */
	subtitle: string;
	/** Card icon */
	icon: ReactNode;
	/** Card color theme */
	color: string;
}

/**
 * Leaderboard Entry Component Props
 * @interface LeaderboardEntryProps
 * @description Props for the LeaderboardEntry component
 * @used_by client/src/views/leaderboard/LeaderboardView.tsx
 */
export interface LeaderboardEntryProps {
	/** Leaderboard entry data */
	entry: LeaderboardEntry;
	/** Entry index in the list */
	index: number;
	/** Whether this is the current user */
	isCurrentUser: boolean;
}
