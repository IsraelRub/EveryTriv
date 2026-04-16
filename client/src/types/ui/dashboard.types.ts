import type { ComponentType, LazyExoticComponent, ReactElement } from 'react';

export type TabModuleLoader = (componentName: string) => Promise<Record<string, ComponentType<object>>>;

export type TabImportsMap = Record<string, () => Promise<Record<string, ComponentType<object>>>>;

export interface TabSpec {
	label: string;
	componentName: string;
}

export interface NormalizedDashboardTab {
	label: string;
	value: string;
	component: LazyExoticComponent<ComponentType<object>>;
}

export interface DashboardWithTabsProps {
	specs: TabSpec[];
	loadModule: TabModuleLoader;
	tabParam: string;
	i18nNamespace: string;
	title: string;
	description: string;
	onRefresh: () => void | Promise<void>;
	filterTabs?: (tab: NormalizedDashboardTab) => boolean;
	defaultTab?: string;
	suspenseFallback?: ReactElement | null;
}
