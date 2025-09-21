/**
 * Leaderboard Component Types
 * @module LeaderboardComponentTypes
 * @description UI component prop types for leaderboard and ranking components
 */
import { LeaderboardEntry } from '@shared';
import { ReactNode } from 'react';

/**
 * Ranking Card Component Props
 * @interface RankingCardProps
 * @description Props for the RankingCard component used in leaderboard
 * @used_by client/src/views/leaderboard
 */
export interface RankingCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  color: string;
}

/**
 * Leaderboard Entry Component Props
 * @interface LeaderboardEntryProps
 * @description Props for the LeaderboardEntry component
 * @used_by client/src/views/leaderboard
 */
export interface LeaderboardEntryProps {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser: boolean;
}
