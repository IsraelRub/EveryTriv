/**
 * Analytics Component Types
 * @module AnalyticsComponentTypes
 * @description UI component prop types for analytics and metrics components
 */

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
