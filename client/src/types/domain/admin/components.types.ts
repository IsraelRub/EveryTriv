import type { TimePeriod } from '@shared/constants';
import type { AdminGameStatistics } from '@shared/types';

import type { AdminTriviaQuestion } from './admin.types';

export interface TriviaTableProps {
	questions?: AdminTriviaQuestion[];
	totalCount?: number;
	isLoading?: boolean;
	onClearAll?: () => void;
}

export interface GameStatisticsCardProps {
	data?: AdminGameStatistics;
	isLoading?: boolean;
}

export interface ConfirmClearDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	itemName: string;
	onConfirm: () => void;
	isLoading?: boolean;
}

export interface PlatformTrendsSectionProps {
	statsLoading: boolean;
}

export interface UserOverviewTabProps {
	activeUserId: string;
}

export interface UserStatisticsTabProps {
	activeUserId: string;
}

export interface UserPerformanceTabProps {
	activeUserId: string;
}

export interface UserProgressTabProps {
	activeUserId: string;
	trendsPeriod: TimePeriod;
}

export interface UserActivityTabProps {
	activeUserId: string;
}

export interface UserTrendsTabProps {
	activeUserId: string;
}

export interface UserComparisonTabProps {
	activeUserId: string;
}

export interface UserInsightsTabProps {
	activeUserId: string;
}
