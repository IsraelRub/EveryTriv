import type {
	SystemRecommendation,
	UserAnalyticsRecord,
	UserInsightsData,
	UserPerformanceMetrics,
	UserSummaryData,
} from '@shared/types';

import type { ClearOperation } from './admin.types';

export interface ManagementActionsProps {
	operations: ClearOperation[];
}

export interface ConfirmClearDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	itemName: string;
	onConfirm: () => void | Promise<void>;
	isLoading: boolean;
}

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
