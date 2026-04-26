// User analytics type definitions.
import { ComparisonTarget } from '../../../constants';
import type { ActivityEntry, CountRecord, DifficultyBreakdown } from '../../core/data.types';
import type { UserRankData } from '../game/game.types';
import type { SystemRecommendation } from './analyticsSystem.types';

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

export interface UserInsightStrengthTopic {
	readonly kind: 'strength_topic';
	readonly topic: string;
	readonly successRate: number;
	readonly gamesPlayed: number;
}

export interface UserInsightImprovementTopic {
	readonly kind: 'improvement_topic';
	readonly topic: string;
	readonly successRate: number;
	readonly gamesPlayed: number;
}

export interface UserInsightBestStreak {
	readonly kind: 'best_streak';
	readonly days: number;
}

export interface UserInsightWeakestTopic {
	readonly kind: 'improve_weakest_topic';
	readonly topic: string;
}

export interface UserInsightRecentActivity {
	readonly kind: 'recent_activity';
	readonly date: string;
	readonly action: string;
	readonly detail?: string;
	readonly topic?: string;
	readonly score?: number;
	readonly gameQuestionCount?: number;
	readonly correctAnswers?: number;
}

export interface UserInsightFallbackHighlight {
	readonly kind: 'fallback_highlight';
}

export type UserInsightItem =
	| UserInsightStrengthTopic
	| UserInsightImprovementTopic
	| UserInsightBestStreak
	| UserInsightWeakestTopic
	| UserInsightRecentActivity
	| UserInsightFallbackHighlight;

export interface UserInsightsData {
	strengths: UserInsightItem[];
	improvements: UserInsightItem[];
	recentHighlights: UserInsightItem[];
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
	};
	performance: UserPerformanceMetrics;
	insights: UserInsightItem[];
}

export interface UnifiedUserAnalyticsResponse {
	statistics?: UserAnalyticsRecord;
	performance?: UserPerformanceMetrics;
	insights?: UserInsightsData;
	recommendations?: SystemRecommendation[];
	summary?: UserSummaryData;
	trends?: UserTrendPoint[];
	activity?: ActivityEntry[];
	progress?: UserProgressAnalytics;
	comparison?: UserComparisonResult;
}
