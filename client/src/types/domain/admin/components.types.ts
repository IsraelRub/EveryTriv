import type { LucideIcon } from 'lucide-react';

import type { TimePeriod } from '@shared/constants';
import type { AdminGameStatistics, TriviaQuestion } from '@shared/types';

import type { TextColor } from '@/constants';

export interface ClearOperation {
	id: string;
	title: string;
	description: string;
	itemName: string;
	currentCount?: number;
	onClear: () => void;
	isLoading?: boolean;
	icon: LucideIcon;
}

export interface AdminTriviaQuestion extends TriviaQuestion {
	userId: string | null;
	isCorrect: boolean | null;
}

export interface TriviaQuestionsResponse {
	questions: AdminTriviaQuestion[];
	totalCount: number;
}

export interface TriviaTableProps {
	questions?: AdminTriviaQuestion[];
	totalCount?: number;
	isLoading?: boolean;
	onClearAll?: () => void;
}

export interface GameStatisticsCardProps {
	data?: AdminGameStatistics;
	isLoading?: boolean;
	onRefresh?: () => void;
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

export interface PlatformTrendsSectionStats {
	icon: LucideIcon;
	label: string;
	value: string;
	color: TextColor;
}

export interface PlatformTrendsSectionProps {
	stats: PlatformTrendsSectionStats[];
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
