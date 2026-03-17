import type { ComparisonTarget, TimePeriod } from '@shared/constants';
import type { CountRecord, GameDifficulty } from '@shared/types';

import type { GameHistoryEntity, UserEntity } from '@internal/entities';

export interface BuildTrendsOptions {
	limit?: number;
	groupBy?: TimePeriod;
}

export interface UnifiedQuerySignatureInput {
	includeSections?: string[];
	startDate?: Date;
	endDate?: Date;
	groupBy?: TimePeriod;
	activityLimit?: number;
	trendLimit?: number;
	includeActivity?: boolean;
	targetUserId?: string;
	comparisonTarget?: ComparisonTarget;
}

export interface DifficultyStatsRaw {
	difficulty: string;
	total: number;
	correct: number;
}

export interface GameStatsSummary {
	successRate: number;
	averageScore: number;
	totalGames: number;
}

export interface AdminStatisticsRaw {
	totalGames: number;
	averageScore: number | null;
	bestScore: number | null;
	totalQuestionsAnswered: number;
	correctAnswers: number;
	lastActivity: Date | null;
	totalScore: number | null;
}

export interface TopicAnalyticsAccumulator {
	gamesPlayed: number;
	totalQuestionsAnswered: number;
	correctAnswers: number;
	score: number;
	totalTimeSpent: number;
	lastPlayed: string | null;
	difficultyBreakdown: CountRecord;
}

export interface DifficultyStatRow {
	difficulty: GameDifficulty;
	total: number;
	correct: number;
	totalQuestions: number;
	scoreSum: number;
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

export interface MeanVarianceStddev {
	mean: number;
	variance: number;
	standardDeviation: number;
}
