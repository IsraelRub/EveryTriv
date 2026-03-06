import type { ComponentType, LazyExoticComponent } from 'react';

export type TabModuleLoader = (componentName: string) => Promise<Record<string, ComponentType<unknown>>>;

export interface TabSpec {
	label: string;
	componentName: string;
}

export interface DashboardTabEntry {
	label: string;
	loader: () => Promise<{ default: ComponentType<unknown> }>;
}

export interface NormalizedDashboardTab {
	label: string;
	value: string;
	component: LazyExoticComponent<ComponentType<unknown>>;
}

export interface DashboardWithTabsLayoutProps {
	title: string;
	description: string;
	onRefresh: () => void | Promise<void>;
	isRefreshing: boolean;
	tabs: NormalizedDashboardTab[];
	defaultTab?: string;
	tabParam?: string;
	suspenseFallback?: React.ReactNode;
}
