import { UserRole } from '@shared/constants';

import type { TabSpec } from '@/types';
import { AdminKey } from '../core/ui/localeKeys.constants';

export const ROLE_BADGE_CLASSES: Record<string, string> = {
	[UserRole.ADMIN]: 'border-2 border-primary text-primary font-semibold',
	[UserRole.USER]: 'border-2 border-muted-foreground text-muted-foreground font-medium',
};

export const ADMIN_TAB_PARAM = 'adminTab';
export const SYSTEM_SUB_TAB_PARAM = 'systemSub';

export const ADMIN_TABS: TabSpec[] = [
	{ label: 'Performance', componentName: 'PerformanceTabContent' },
	{ label: 'Trivia', componentName: 'TriviaManagementTable' },
	{ label: 'Users', componentName: 'UsersTable' },
	{ label: 'Business', componentName: 'BusinessTabContent' },
	{ label: 'System', componentName: 'SystemTabContent' },
	{ label: 'AI Providers', componentName: 'ProviderManagementSection' },
];

export enum UserSortField {
	EMAIL = 'email',
	ROLE = 'role',
	CREATED_AT = 'createdAt',
	LAST_LOGIN = 'lastLogin',
}

export const USER_SORT_FIELDS_SET: ReadonlySet<string> = new Set(Object.values(UserSortField));

export enum TriviaSortField {
	QUESTION = 'question',
	TOPIC = 'topic',
	DIFFICULTY = 'difficulty',
	CREATED = 'created',
}

export const TRIVIA_SORT_FIELDS_SET: ReadonlySet<string> = new Set(Object.values(TriviaSortField));

export enum SystemSubTab {
	HEALTH = 'health',
	CONSISTENCY = 'consistency',
	MAINTENANCE = 'maintenance',
}

export function isSystemSubTab(value: string): value is SystemSubTab {
	return value === SystemSubTab.HEALTH || value === SystemSubTab.CONSISTENCY || value === SystemSubTab.MAINTENANCE;
}

export const SYSTEM_SUB_TABS: ReadonlyArray<{ value: SystemSubTab; labelKey: string }> = [
	{ value: SystemSubTab.HEALTH, labelKey: AdminKey.SYSTEM_SUB_HEALTH },
	{ value: SystemSubTab.CONSISTENCY, labelKey: AdminKey.SYSTEM_SUB_CONSISTENCY },
	{ value: SystemSubTab.MAINTENANCE, labelKey: AdminKey.SYSTEM_SUB_MAINTENANCE },
];

export enum PerformanceTabAccordion {
	GAME_STATS = 'game-stats',
	TRENDS = 'trends',
	CHARTS = 'charts',
}

export enum BusinessTabAccordion {
	USER_METRICS = 'user-metrics',
	ENGAGEMENT = 'engagement',
	PRICING = 'pricing',
}

export enum UserAnalysisAccordion {
	OVERVIEW = 'overview',
	STATISTICS = 'statistics',
	PERFORMANCE = 'performance',
	INSIGHTS = 'insights',
	RECOMMENDATIONS = 'recommendations',
}

export enum SystemSecurityAccordion {
	AUTH = 'security-auth',
	AUTHZ = 'security-authz',
	DATA = 'security-data',
}

export enum SystemInsightAccordion {
	PERF = 'si-perf',
	SEC = 'si-sec',
	USER = 'si-user',
	HEALTH = 'si-health',
	TRENDS = 'si-trends',
}

export const ADMIN_PRICING_PACKAGE = {
	credits: {
		min: 1,
		max: 100_000,
	},
	price: {
		min: 0.01,
		max: 99_999.99,
	},
} as const;
