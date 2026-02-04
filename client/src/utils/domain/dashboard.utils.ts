import { lazy } from 'react';

import type { DashboardTabEntry, NormalizedDashboardTab } from '@/types';

export function buildDashboardTabsConfig(entries: DashboardTabEntry[]): NormalizedDashboardTab[] {
	return entries.map(({ label, loader }) => ({
		label,
		value: label.toLowerCase(),
		component: lazy(loader),
	}));
}
