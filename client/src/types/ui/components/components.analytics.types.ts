/**
 * Analytics Component Types
 * @module AnalyticsComponentTypes
 * @description UI component prop types for analytics and metrics components
 */
import { UserAnalytics } from '@shared';

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
  /** Optional trend indicator */
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * Comparison Card Component Props
 * @interface ComparisonCardProps
 * @description Props for the ComparisonCard component used in analytics
 * @used_by client/src/views/analytics/AnalyticsView.tsx
 */
export interface ComparisonCardProps {
  /** Card title */
  title: string;
  /** User's value */
  userValue: number;
  /** Average value for comparison */
  averageValue: number;
  /** Unit of measurement */
  unit: string;
  /** Whether higher values are better */
  higherIsBetter: boolean;
}

/**
 * Activity Component Props
 * @interface RecentActivityProps
 * @description Props for the Activity component
 */
export interface RecentActivityProps {
  /** Analytics data */
  analyticsData: UserAnalytics;
}

/**
 * Topics Chart Component Props
 * @interface TopicsChartProps
 * @description Props for the TopicsChart component
 */
export interface TopicsChartProps {
  /** Topics played data */
  topicsPlayed: Record<string, number>;
}

/**
 * Difficulty Chart Component Props
 * @interface DifficultyChartProps
 * @description Props for the DifficultyChart component
 */
export interface DifficultyChartProps {
  /** Difficulty breakdown data */
  difficultyBreakdown: Record<string, { correct: number; total: number }>;
}
