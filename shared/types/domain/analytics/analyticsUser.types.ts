// User analytics type definitions.
import { ComparisonTarget } from '../../../constants';
import type { ActivityEntry, CountRecord, DifficultyBreakdown } from '../../core/data.types';
import type { UserRankData } from '../game/game.types';

export interface UserAnalyticsQuery {
	startDate?: Date;
	endDate?: Date;
	includeGameHistory?: boolean;
	includePerformance?: boolean;
	includeTopicBreakdown?: boolean;
}

export interface UserAnalyticsRecord {
	totalGames: number;
	totalQuestionsAnswered: number;
	successRate: number;
	averageScore: number;
	bestScore: number;
	totalPlayTime: number;
	correctAnswers: number;
	userId: string;
	favoriteTopic?: string;
	mostPlayedTopic?: string;
	averageTimePerQuestion?: number;
	totalScore?: number;
	topicsPlayed?: CountRecord;
	difficultyBreakdown?: DifficultyBreakdown;
	recentActivity?: ActivityEntry[];
}

export interface UserBasicInfo {
	userId: string;
	email: string;
	credits: number;
	purchasedCredits: number;
	totalCredits: number;
	createdAt: Date;
	accountAge: number;
}

export interface UserPerformanceMetrics {
	lastPlayed: Date;
	streakDays: number;
	bestStreak: number;
	improvementRate: number;
	weakestTopic: string;
	strongestTopic: string;
	averageGameTime?: number;
	consistencyScore?: number;
	learningCurve?: number;
}

export interface CompleteUserAnalytics {
	basic: UserBasicInfo;
	game: UserAnalyticsRecord;
	performance: UserPerformanceMetrics;
	ranking: UserRankData;
	trends?: UserTrendPoint[];
}

export interface UserProgressTopic {
	topic: string;
	gamesPlayed: number;
	totalQuestionsAnswered: number;
	correctAnswers: number;
	successRate: number;
	averageResponseTime: number;
	lastPlayed: string | null;
	difficultyBreakdown: CountRecord;
}

export interface UserTrendPoint {
	date: string;
	score: number;
	successRate: number;
	totalQuestionsAnswered: number;
	correctAnswers: number;
	topic?: string;
	difficulty?: string;
}

export interface UserProgressAnalytics {
	topics: UserProgressTopic[];
	timeline: UserTrendPoint[];
	totals: {
		gamesPlayed: number;
		questionsAnswered: number;
		correctAnswers: number;
	};
}

export interface UserProgressData {
	userId: string;
	topic: string;
	correctAnswers: number;
	totalQuestionsAnswered: number;
	averageResponseTime: number;
	lastPlayed: string;
	difficulty: string;
}

export interface UserInsightsData {
	strengths: string[];
	improvements: string[];
	recentHighlights: string[];
}

export interface UserComparisonMetrics {
	successRate: number;
	averageScore: number;
	totalGames: number;
	rank?: number;
	percentile?: number;
	streakDays?: number;
	bestStreak?: number;
	improvementRate?: number;
	consistencyScore?: number;
}

export interface UserComparisonResult {
	userId: string;
	target: ComparisonTarget;
	targetUserId?: string;
	userMetrics: UserComparisonMetrics;
	targetMetrics: UserComparisonMetrics;
	differences: UserComparisonMetrics;
}

export interface UserSummaryData {
	user: UserBasicInfo;
	highlights: {
		totalGames: number;
		bestScore: number;
		topTopics: string[];
		achievementsUnlocked: number;
	};
	performance: UserPerformanceMetrics;
	insights: string[];
}
