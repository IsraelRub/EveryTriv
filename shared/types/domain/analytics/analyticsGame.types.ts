// Game analytics type definitions.
import type { CountRecord, DifficultyBreakdown } from '../../core/data.types';
import type { BaseGameStatistics } from '../game/game.types';
import type { TimeStat } from './analyticsCommon.types';

export interface TopicAnalyticsRecord {
	topic: string;
	totalGames: number;
}

export interface GameAnalyticsQuery {
	startDate?: Date;
	endDate?: Date;
	topic?: string;
	difficulty?: string;
	includeDetailedStats?: boolean;
}

export interface GameAnalyticsStatsEntry {
	total: number;
	correct: number;
	successRate: number;
}

export type GameAnalyticsStats = Record<string, GameAnalyticsStatsEntry>;

export type GameStatsCore = Pick<
	BaseGameStatistics,
	'totalGames' | 'totalQuestionsAnswered' | 'successRate' | 'averageScore'
>;

export interface GameStatsData extends GameStatsCore {
	popularTopics: string[];
	difficultyDistribution: CountRecord;
	timeStats: TimeStat;
}

export interface TopicStatsData {
	topics: TopicAnalyticsRecord[];
	totalTopics: number;
}

export interface DifficultyStatsData {
	difficulties: DifficultyBreakdown;
	totalQuestionsAnswered: number;
}

export interface GlobalStatsResponse {
	successRate: number;
	averageGames: number;
	averageGameTime: number;
	consistency: number;
}
