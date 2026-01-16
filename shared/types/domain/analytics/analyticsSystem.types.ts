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

export interface SystemStatsQuery {
	startDate?: Date;
	endDate?: Date;
	includeInactive?: boolean;
}

export interface SystemInsights {
	performanceInsights: string[];
	securityInsights: string[];
	userBehaviorInsights: string[];
	systemHealthInsights: string[];
	status: string;
	trends: string[];
	timestamp: Date;
}

export interface BusinessMetricsRevenue {
	total: number;
	mrr: number;
	arpu: number;
}

export interface BusinessMetricsUsers {
	total: number;
	active: number;
	newThisMonth: number;
	churnRate: number;
}

export interface BusinessMetricsEngagement {
	dau: number;
	wau: number;
	mau: number;
	avgSessionDuration: number;
}

export interface BusinessMetrics {
	revenue: BusinessMetricsRevenue;
	users: BusinessMetricsUsers;
	engagement: BusinessMetricsEngagement;
}

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
