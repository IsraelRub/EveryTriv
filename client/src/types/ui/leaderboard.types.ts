import type { ElementType } from 'react';

import type { LeaderboardEntry } from '@shared/types';

export interface CardMetricProps {
	title: string;
	value: string;
	subtitle: string;
	/** Icon component (e.g. LucideIcon), rendered with createElement(icon, props). */
	icon: ElementType;
	color: string;
	trend?: string;
}

export interface LeaderboardEntryProps {
	entry: LeaderboardEntry;
	isCurrentUser: boolean;
}
