import type { CountRecord, GameDifficulty, TrendQueryOptions } from '@shared/types';

import type { GameHistoryEntity, UserEntity } from '@internal/entities';

export interface TopicAnalyticsAccumulator {
	gamesPlayed: number;
	totalQuestionsAnswered: number;
	correctAnswers: number;
	totalTimeSpent: number;
	lastPlayed: string | null;
	difficultyBreakdown: CountRecord;
}

export interface DifficultyStatsRecord {
	difficulty: GameDifficulty;
	total: number;
	correct: number;
}

export interface GetUserSummaryParams {
	userId: string;
	includeActivity: boolean;
}

export interface GetUserAnalyticsParams {
	userId: string;
	query?: TrendQueryOptions;
}

export interface UserWithHistoryResult {
	user: UserEntity;
	history: GameHistoryEntity[];
}

export interface TopicCountRecord {
	topic: string;
	count: number;
}

export interface NumericQueryResult {
	value: number | null;
}

export interface UserIdSuccessRateRecord {
	userId: string;
	successRate: number;
}
