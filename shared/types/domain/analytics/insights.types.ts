/**
 * Analytics insights and recommendations types for EveryTriv
 *
 * @module InsightsTypes
 * @description Type definitions for analytics insights and system recommendations
 * @used_by server/src/features/analytics/analytics.service.ts
 */

/**
 * Analytics insights interface
 * @interface AnalyticsInsights
 * @description Insights derived from analytics data
 * @used_by server/src/features/analytics/analytics.service.ts
 */
export interface AnalyticsInsights {
	qualityInsights: string[];
	performanceInsights: string[];
	topicInsights: string[];
}

/**
 * System insights interface
 * @interface SystemInsights
 * @description System-level insights and recommendations
 */
export interface SystemInsights {
	performanceInsights: string[];
	securityInsights: string[];
	userBehaviorInsights: string[];
	systemHealthInsights: string[];
	status: 'healthy' | 'warning' | 'critical' | 'good' | 'optimal';
	trends: string[];
	timestamp: Date;
}
