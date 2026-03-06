import { lazy } from 'react';

import type { NormalizedDashboardTab, TabModuleLoader, TabSpec } from '@/types';

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
