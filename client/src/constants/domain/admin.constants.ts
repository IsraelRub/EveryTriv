import { UserRole } from '@shared/constants';

import type { TabSpec } from '@/types';

export const ROLE_BADGE_CLASSES: Record<string, string> = {
	[UserRole.ADMIN]: 'border-2 border-primary text-primary font-semibold',
	[UserRole.USER]: 'border-2 border-muted-foreground text-muted-foreground font-medium',
};

export const ADMIN_TABS: TabSpec[] = [
	{ label: 'Performance', componentName: 'AdminPerformanceTab' },
	{ label: 'Trivia', componentName: 'AdminTriviaTab' },
	{ label: 'Users', componentName: 'AdminUsersTab' },
	{ label: 'Business', componentName: 'AdminBusinessTab' },
	{ label: 'System', componentName: 'AdminSystemTab' },
	{ label: 'AI Providers', componentName: 'AdminAiProvidersTab' },
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
