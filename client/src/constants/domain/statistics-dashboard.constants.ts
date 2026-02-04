import type { DashboardTabEntry } from '@/types/domain/dashboard-tabs.types';

export const STATISTICS_TAB_PARAM = 'tab';

export const STATISTICS_TAB_ENTRIES: DashboardTabEntry[] = [
	{
		label: 'Performance',
		loader: async () => {
			const m = await import('@/views/statistics/tabs/StatisticsPerformanceTab');
			return { default: m.StatisticsPerformanceTab };
		},
	},
	{
		label: 'History',
		loader: async () => {
			const m = await import('@/views/statistics/tabs/StatisticsHistoryTab');
			return { default: m.StatisticsHistoryTab };
		},
	},
	{
		label: 'Leaderboard',
		loader: async () => {
			const m = await import('@/views/statistics/tabs/StatisticsLeaderboardTab');
			return { default: m.StatisticsLeaderboardTab };
		},
	},
];
