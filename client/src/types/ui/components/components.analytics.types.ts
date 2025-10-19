/**
 * Analytics Component Types
 * @module AnalyticsComponentTypes
 * @description UI component prop types for analytics and metrics components
 */
import type { UserAnalytics } from '@shared/types';

/**
 * Metric Card Component Props
 * @interface MetricCardProps
 * @description Props for the MetricCard component used in analytics
 * @used_by client/src/views/analytics/AnalyticsView.tsx
 */
export interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: 'yellow' | 'blue' | 'green' | 'purple';
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * Comparison Card Component Props
 * @interface ComparisonCardProps
 * @description Props for the ComparisonCard component used in analytics
 * @used_by client/src/views/analytics/AnalyticsView.tsx
 */
export interface ComparisonCardProps {
  title: string;
  userValue: number;
  averageValue: number;
  unit: string;
  higherIsBetter: boolean;
}

/**
 * Activity Component Props
 * @interface RecentActivityProps
 * @description Props for the Activity component
 */
export interface RecentActivityProps {
  analyticsData: UserAnalytics;
}

/**
 * Topics Chart Component Props
 * @interface TopicsChartProps
 * @description Props for the TopicsChart component
 */
export interface TopicsChartProps {
  topicsPlayed: Record<string, number>;
}

/**
 * Difficulty Chart Component Props
 * @interface DifficultyChartProps
 * @description Props for the DifficultyChart component
 */
export interface DifficultyChartProps {
  difficultyBreakdown: Record<string, { correct: number; total: number }>;
}
