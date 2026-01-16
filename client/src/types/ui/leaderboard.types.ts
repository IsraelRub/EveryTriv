import { ReactNode } from 'react';

import type { LeaderboardEntry } from '@shared/types';

import { MetricColor, TrendDirection } from '@/constants';

export interface CardMetricProps {
	title: string;
	value: string;
	subtitle: string;
	icon: ReactNode;
	color: MetricColor;
	trend?: TrendDirection;
}

export interface LeaderboardEntryProps {
	entry: LeaderboardEntry;
	isCurrentUser: boolean;
}
