/**
 * System and business analytics type definitions
 *
 * @module AnalyticsSystemTypes
 * @description Structures for system-level analytics, insights, recommendations, and business metrics
 */

/**
 * System statistics interface
 */
export interface SystemStats {
	totalUsers: number;
	activeUsers24h: number;
	activeUsers: number;
	totalQuestionsGenerated: number;
	totalQuestionsAnswered: number;
	uptime: number;
	averageResponseTime: number;
	errorRate: number;
}

/**
 * System statistics query parameters
 */
export interface SystemStatsQuery {
	startDate?: string;
	endDate?: string;
	includeInactive?: boolean;
}

/**
 * System insights interface
 */
export interface SystemInsights {
	performanceInsights: string[];
	securityInsights: string[];
	userBehaviorInsights: string[];
	systemHealthInsights: string[];
	status: string;
	trends: string[];
	timestamp: Date;
}

/**
 * Business metrics revenue interface
 */
export interface BusinessMetricsRevenue {
	total: number;
	mrr: number;
	arpu: number;
}

/**
 * Business metrics users interface
 */
export interface BusinessMetricsUsers {
	total: number;
	active: number;
	newThisMonth: number;
	churnRate: number;
}

/**
 * Business metrics engagement interface
 */
export interface BusinessMetricsEngagement {
	dau: number;
	wau: number;
	mau: number;
	avgSessionDuration: number;
}

/**
 * Business metrics interface
 */
export interface BusinessMetrics {
	revenue: BusinessMetricsRevenue;
	users: BusinessMetricsUsers;
	engagement: BusinessMetricsEngagement;
}

/**
 * System recommendation interface
 */
export interface SystemRecommendation {
	id: string;
	type: string;
	title: string;
	description: string;
	message: string;
	action: string;
	priority: string;
	estimatedImpact: string;
	implementationEffort: string;
}
