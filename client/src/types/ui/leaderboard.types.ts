import { ReactNode } from 'react';

import type { LeaderboardEntry } from '@shared/types';

import { NamedColor, TrendDirection } from '@/constants';

export interface CardMetricProps {
	title: string;
	value: string;
	subtitle: string;
	icon: ReactNode;
	color: NamedColor;
	trend?: TrendDirection;
}

export interface LeaderboardEntryProps {
	entry: LeaderboardEntry;
	isCurrentUser: boolean;
}
