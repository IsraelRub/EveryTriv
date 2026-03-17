import { lazy } from 'react';

import type { NormalizedDashboardTab, TabImportsMap, TabModuleLoader, TabSpec } from '@/types';

const TAB_IMPORTS: Record<'statistics' | 'admin', TabImportsMap> = {
	statistics: {
		PerformanceTabContent: () => import('@/components/statistics/performance/PerformanceTabContent'),
		HistoryTabContent: () => import('@/components/statistics/history/HistoryTabContent'),
		LeaderboardTabContent: () => import('@/components/statistics/leaderboard/LeaderboardTabContent'),
	},
	admin: {
		PerformanceTabContent: () => import('@/components/admin/performance/PerformanceTabContent'),
		TriviaManagementTable: () => import('@/components/admin/trivia/TriviaManagementTable'),
		UsersTable: () => import('@/components/admin/users/UsersTable'),
		BusinessTabContent: () => import('@/components/admin/business/BusinessTabContent'),
		SystemTabContent: () => import('@/components/admin/system/SystemTabContent'),
		ProviderManagementSection: () => import('@/components/admin/aiProviders/ProviderManagementSection'),
	},
};

export function buildDashboardTabsConfig(tabs: TabSpec[], loadModule: TabModuleLoader): NormalizedDashboardTab[] {
	return tabs.map(({ label, componentName }) => ({
		label,
		value: label.toLowerCase(),
		component: lazy(async () => {
			const m = await loadModule(componentName);
			const Component = m[componentName];
			if (!Component) throw new Error(`Missing export: ${componentName}`);
			return { default: Component };
		}),
	}));
}

export function createTabLoader(kind: 'statistics' | 'admin'): TabModuleLoader {
	const imports = TAB_IMPORTS[kind];
	return (componentName: string) => {
		const load = imports[componentName];
		if (!load) throw new Error(`Unknown ${kind} tab: ${componentName}`);
		return load();
	};
}
