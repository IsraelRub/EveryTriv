import type { LucideIcon } from 'lucide-react';

import type {
	AnalyticsResponse,
	SystemRecommendation,
	UserAnalyticsRecord,
	UserInsightsData,
	UserPerformanceMetrics,
	UserSummaryData,
} from '@shared/types';

import type { AdminKey } from '@/constants';

export interface UserTableRow {
	id: string;
	email: string;
	role: string;
	createdAt: string;
	lastLogin: string;
	firstName?: string;
	lastName?: string;
}

export interface ConsistencyDiscrepancy {
	expected: number;
	actual: number;
}

export interface ConsistencyResultRow {
	userId: string;
	isConsistent: boolean;
	discrepancies: {
		totalGames: ConsistencyDiscrepancy;
		totalQuestionsAnswered: ConsistencyDiscrepancy;
		correctAnswers: ConsistencyDiscrepancy;
		totalScore: ConsistencyDiscrepancy;
	};
}

export interface CheckAllUsersConsistencyResponse {
	totalUsers: number;
	usersWithGames: number;
	consistentUsers: number;
	inconsistentUsers: number;
	results: ConsistencyResultRow[];
}

export interface UserAnalysisExpandedPanelProps {
	analysisLoading: boolean;
	summaryError: boolean;
	summaryData: UserSummaryData | undefined;
	statisticsData: UserAnalyticsRecord | undefined;
	performanceData: UserPerformanceMetrics | undefined;
	insightsData: UserInsightsData | undefined;
	recommendationsData: SystemRecommendation[] | undefined;
}

export interface UseAdminUserPanelQueriesResult {
	userSummary: AnalyticsResponse<UserSummaryData> | undefined;
	summaryLoading: boolean;
	summaryError: boolean;
	userStatistics: AnalyticsResponse<UserAnalyticsRecord> | undefined;
	statisticsLoading: boolean;
	userPerformance: AnalyticsResponse<UserPerformanceMetrics> | undefined;
	performanceLoading: boolean;
	userInsights: AnalyticsResponse<UserInsightsData> | undefined;
	insightsLoading: boolean;
	userRecommendations: AnalyticsResponse<SystemRecommendation[]> | undefined;
	recommendationsLoading: boolean;
}

export interface SystemInsightDetailGridProps {
	readonly items: string[];
	readonly categoryIcon: LucideIcon;
	readonly categoryLabelKey: AdminKey;
	readonly idPrefix: string;
}
