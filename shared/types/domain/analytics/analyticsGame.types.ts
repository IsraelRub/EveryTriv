/**
 * Game analytics type definitions
 *
 * @module AnalyticsGameTypes
 * @description Structures for tracking game performance, topics, and difficulty analytics
 */
import type { DifficultyBreakdown, TopicsPlayed } from '../../core/data.types';
import type { BaseGameTopicDifficulty } from '../game/trivia.types';
import type { TimeStat } from './analyticsCommon.types';

/**
 * Topic analytics record interface
 */
export interface TopicAnalyticsRecord {
	topic: string;
	totalGames: number;
}

/**
 * Detailed analytics for individual questions
 */
export interface QuestionAnalytics extends BaseGameTopicDifficulty {
	id?: string;
	questionId?: string;
	question?: string;
	difficultyLevel?: string;
	answerCount: number;
	totalAttempts: number;
	correctCount: number;
	correctAttempts: number;
	successRate: number;
	averageTimeToAnswer: number;
	averageTime: number;
	complexityScore: number;
}

/**
 * Game analytics query parameters
 */
export interface GameAnalyticsQuery {
	startDate?: Date;
	endDate?: Date;
	topic?: string;
	difficulty?: string;
	includeDetailedStats?: boolean;
}

/**
 * Entry structure for aggregated game analytics
 */
export interface GameAnalyticsStatsEntry {
	total: number;
	correct: number;
	successRate: number;
}

/**
 * Game analytics stats interface for database queries
 */
export type GameAnalyticsStats = Record<string, GameAnalyticsStatsEntry>;

/**
 * Core game statistics summary
 */
export interface GameStatsCore {
	totalGames: number;
	totalQuestionsAnswered: number;
	averageScore: number;
}

/**
 * Game statistics overview with popularity and difficulty breakdowns
 */
export interface GameStatsData extends GameStatsCore {
	popularTopics: string[];
	difficultyDistribution: TopicsPlayed;
	timeStats: TimeStat;
}

/**
 * Topic statistics data interface
 */
export interface TopicStatsData {
	topics: TopicAnalyticsRecord[];
	totalTopics: number;
}

/**
 * Difficulty statistics data interface
 */
export interface DifficultyStatsData {
	difficulties: DifficultyBreakdown;
	totalQuestionsAnswered: number;
}

/**
 * Global statistics response interface
 * @interface GlobalStatsResponse
 * @description Global averages for comparison with user metrics
 * @used_by client: client/src/views/analytics/AnalyticsView.tsx (comparison cards)
 */
export interface GlobalStatsResponse {
	successRate: number;
	averageGames: number;
	averageGameTime: number;
	consistency: number;
}
