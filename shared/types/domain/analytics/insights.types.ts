/**
 * Analytics insights and recommendations types for EveryTriv
 *
 * @module InsightsTypes
 * @description Type definitions for analytics insights and system recommendations
 * @used_by server: server/src/shared/utils/trivia.utils.ts (ServerUtils.getAnalyticsInsights)
 */

/**
 * Analytics insights interface
 * @interface AnalyticsInsights
 * @description Insights derived from analytics data
 * @used_by server/src/shared/utils/trivia.utils.ts (ServerUtils.getAnalyticsInsights)
 */
export interface AnalyticsInsights {
	/** Quality-related insights */
	qualityInsights: string[];
	/** Performance-related insights */
	performanceInsights: string[];
	/** Topic-related insights */
	topicInsights: string[];
}

/**
 * System insights interface
 * @interface SystemInsights
 * @description System-level insights and recommendations
 */
export interface SystemInsights {
	/** Performance insights */
	performanceInsights: string[];
	/** Security insights */
	securityInsights: string[];
	/** User behavior insights */
	userBehaviorInsights: string[];
	/** System health insights */
	systemHealthInsights: string[];
	/** System status */
	status: 'healthy' | 'warning' | 'critical' | 'good' | 'optimal';
	trends: string[];
	/** Timestamp */
	timestamp: Date;
}
