import { Activity, Brain, FileQuestion, GamepadIcon, Medal, Percent } from 'lucide-react';

import type { AdminGameStatSpec, TabSpec } from '@/types';
import { Colors } from '../core/ui/color.constants';

export const STATISTICS_TAB_PARAM = 'tab';

export enum ViewAllDestination {
	LEADERBOARD = 'leaderboard',
	HISTORY = 'history',
	PERFORMANCE = 'performance',
	STATISTICS = 'statistics',
}

export const STATISTICS_TABS: TabSpec[] = [
	{ label: 'Performance', componentName: 'StatisticsPerformanceTab' },
	{ label: 'History', componentName: 'StatisticsHistoryTab' },
	{ label: 'Leaderboard', componentName: 'StatisticsLeaderboardTab' },
];

export const FILTER_ALL_VALUE = '__all__';

export enum SortField {
	DATE = 'date',
	SCORE = 'score',
	TOPIC = 'topic',
	DIFFICULTY = 'difficulty',
	MODE = 'mode',
}

export enum SortDirection {
	ASC = 'asc',
	DESC = 'desc',
}

export const SORT_FIELD_VALUES = new Set<string>(Object.values(SortField));

export enum AchievementCardVariant {
	COMPACT = 'compact',
	DETAILED = 'detailed',
}

export enum AchievementsDescriptionKind {
	YOUR = 'your',
	USER = 'user',
}

export const ADMIN_GAME_STATS_SPEC: AdminGameStatSpec[] = [
	{ icon: GamepadIcon, label: 'Total Games', color: Colors.BLUE_500.text, key: 'totalGames', format: 'integer' },
	{ icon: Medal, label: 'Best Score', color: Colors.YELLOW_500.text, key: 'bestScore', format: 'integer' },
	{ icon: Percent, label: 'Average Score', color: Colors.GREEN_500.text, key: 'averageScore', format: 'decimal' },
	{ icon: Brain, label: 'Accuracy', color: Colors.PURPLE_500.text, key: 'accuracy', format: 'percent' },
	{
		icon: Activity,
		label: 'Active Players (24h)',
		color: Colors.ORANGE_500.text,
		key: 'activePlayers24h',
		format: 'integer',
	},
	{
		icon: FileQuestion,
		label: 'Questions Answered',
		color: Colors.CYAN_500.text,
		key: 'totalQuestionsAnswered',
		format: 'integer',
	},
];
