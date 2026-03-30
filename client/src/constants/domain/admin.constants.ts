import { UserRole } from '@shared/constants';

import { AdminKey } from '../core/ui/localeKeys.constants';
import type { TabSpec } from '@/types';

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

/** Radix Accordion `value` ids — Performance tab (admin). */
export enum PerformanceTabAccordion {
	GAME_STATS = 'game-stats',
	TRENDS = 'trends',
	CHARTS = 'charts',
}

/** Radix Accordion `value` ids — Business tab (admin). */
export enum BusinessTabAccordion {
	USER_METRICS = 'user-metrics',
	ENGAGEMENT = 'engagement',
	PRICING = 'pricing',
}

/** Radix Accordion `value` ids — expanded user analysis panel. */
export enum UserAnalysisAccordion {
	OVERVIEW = 'overview',
	STATISTICS = 'statistics',
	PERFORMANCE = 'performance',
	INSIGHTS = 'insights',
	RECOMMENDATIONS = 'recommendations',
}

/** Radix Accordion `value` ids — security subsection (system health). */
export enum SystemSecurityAccordion {
	AUTH = 'security-auth',
	AUTHZ = 'security-authz',
	DATA = 'security-data',
}

/** Radix Accordion `value` ids — system insights subsection. */
export enum SystemInsightAccordion {
	PERF = 'si-perf',
	SEC = 'si-sec',
	USER = 'si-user',
	HEALTH = 'si-health',
	TRENDS = 'si-trends',
}
