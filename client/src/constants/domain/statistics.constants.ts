import { Activity, Brain, CirclePercent, FileQuestion, GamepadIcon, Medal } from 'lucide-react';

import type { AdminGameStatSpec, TabSpec } from '@/types';
import { Colors } from '../core/ui/color.constants';

export enum StatsSectionLayout {
	SECTION = 'section',
	PLAIN = 'plain',
}

export enum AdminGameStatFormat {
	INTEGER = 'integer',
	DECIMAL = 'decimal',
	PERCENT = 'percent',
}

export enum AdminGameStatKey {
	TOTAL_GAMES = 'totalGames',
	BEST_SCORE = 'bestScore',
	AVERAGE_SCORE = 'averageScore',
	ACCURACY = 'accuracy',
	ACTIVE_PLAYERS_24H = 'activePlayers24h',
	TOTAL_QUESTIONS_ANSWERED = 'totalQuestionsAnswered',
}

export const STATISTICS_TAB_PARAM = 'tab';
export const LEADERBOARD_PERIOD_PARAM = 'leaderboardPeriod';

export enum ViewAllDestination {
	LEADERBOARD = 'leaderboard',
	HISTORY = 'history',
	PERFORMANCE = 'performance',
	STATISTICS = 'statistics',
}

export const STATISTICS_TABS: TabSpec[] = [
	{ label: 'Performance', componentName: 'PerformanceTabContent' },
	{ label: 'History', componentName: 'HistoryTabContent' },
	{ label: 'Leaderboard', componentName: 'LeaderboardTabContent' },
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

export const ADMIN_GAME_STATS_SPEC: AdminGameStatSpec[] = [
	{
		icon: GamepadIcon,
		label: 'Total Games',
		color: Colors.BLUE_500.text,
		key: AdminGameStatKey.TOTAL_GAMES,
		format: AdminGameStatFormat.INTEGER,
	},
	{
		icon: Medal,
		label: 'Best Score',
		color: Colors.YELLOW_500.text,
		key: AdminGameStatKey.BEST_SCORE,
		format: AdminGameStatFormat.INTEGER,
	},
	{
		icon: CirclePercent,
		label: 'Average Score',
		color: Colors.GREEN_500.text,
		key: AdminGameStatKey.AVERAGE_SCORE,
		format: AdminGameStatFormat.DECIMAL,
	},
	{
		icon: Brain,
		label: 'Accuracy',
		color: Colors.PURPLE_500.text,
		key: AdminGameStatKey.ACCURACY,
		format: AdminGameStatFormat.PERCENT,
	},
	{
		icon: Activity,
		label: 'Active Players (24h)',
		color: Colors.ORANGE_500.text,
		key: AdminGameStatKey.ACTIVE_PLAYERS_24H,
		format: AdminGameStatFormat.INTEGER,
	},
	{
		icon: FileQuestion,
		label: 'Questions Answered',
		color: Colors.CYAN_500.text,
		key: AdminGameStatKey.TOTAL_QUESTIONS_ANSWERED,
		format: AdminGameStatFormat.INTEGER,
	},
];
