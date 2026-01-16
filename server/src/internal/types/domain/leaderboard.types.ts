import type { LeaderboardPeriod } from '@shared/constants';

export interface GlobalLeaderboardParams {
	limit?: number;
	offset?: number;
}

export interface LeaderboardPeriodParams {
	period: LeaderboardPeriod;
	limit?: number;
}

export interface AverageRecord {
	average: number | null;
}

export interface TotalUsersRecord {
	total: number | null;
	users: number | null;
}
