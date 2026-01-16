import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ComparisonTarget, ERROR_CODES, SERVER_CACHE_KEYS, TIME_PERIODS_MS } from '@shared/constants';
import type {
	Achievement,
	ActivityEntry,
	AnalyticsResponse,
	ComparisonQueryOptions,
	CompleteUserAnalytics,
	CountRecord,
	DifficultyBreakdown,
	DifficultyStatsRaw,
	HistoryFilterOptions,
	SystemRecommendation,
	TrendQueryOptions,
	UserAnalyticsRecord,
	UserComparisonMetrics,
	UserComparisonResult,
	UserInsightsData,
	UserPerformanceMetrics,
	UserProgressAnalytics,
	UserProgressTopic,
	UserSummaryData,
	UserTrendPoint,
} from '@shared/types';
import { calculateSuccessRate, getErrorMessage } from '@shared/utils';
import { isCompleteUserAnalyticsData } from '@shared/utils/domain';
import { isGameDifficulty, isUuid } from '@shared/validation';

import { SQL_CONDITIONS } from '@internal/constants';
import { GameHistoryEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type {
	GetUserAnalyticsParams,
	GetUserSummaryParams,
	TopicAnalyticsAccumulator,
	TopicCountRecord,
	UserWithHistoryResult,
} from '@internal/types';
import { calculateCategoryPerformance, calculateStreak, createNotFoundError } from '@internal/utils';

import { AnalyticsCommonService } from './common-analytics.service';
import { SystemAnalyticsService } from './system-analytics.service';

@Injectable()
export class UserAnalyticsService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepo: Repository<UserEntity>,
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepo: Repository<GameHistoryEntity>,
		@InjectRepository(UserStatsEntity)
		private readonly userStatsRepo: Repository<UserStatsEntity>,
		private readonly cacheService: CacheService,
		private readonly systemAnalyticsService: SystemAnalyticsService,
		private readonly analyticsCommon: AnalyticsCommonService
	) {}

	async getUserStats(userId: string): Promise<UserAnalyticsRecord> {
		try {
			logger.analyticsStats('user', {
				userId,
			});

			const user = await this.userRepo.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			const stats = await this.calculateUserStats(userId);

			return {
				userId,
				totalGames: stats.totalGames,
				totalQuestionsAnswered: stats.totalQuestionsAnswered,
				successRate: stats.successRate,
				averageScore: stats.averageScore,
				bestScore: Math.round(stats.bestScore),
				totalPlayTime: stats.totalPlayTime,
				correctAnswers: stats.correctAnswers,
				mostPlayedTopic: stats.mostPlayedTopic,
				averageTimePerQuestion: stats.averageTimePerQuestion,
				totalScore: stats.totalScore,
				topicsPlayed: stats.topicsPlayed,
				difficultyBreakdown: stats.difficultyBreakdown,
				recentActivity: stats.recentActivity,
			};
		} catch (error) {
			logger.analyticsError('getUserStats', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async getUserAnalytics(userId: string): Promise<CompleteUserAnalytics> {
		try {
			const cacheKey = SERVER_CACHE_KEYS.ANALYTICS.USER(userId);

			return await this.cacheService.getOrSet<CompleteUserAnalytics>(
				cacheKey,
				async () => {
					const user = await this.userRepo.findOne({ where: { id: userId } });
					if (!user) {
						throw createNotFoundError('User');
					}

					const gameAnalytics = await this.getUserStats(userId);

					const gameHistory = await this.gameHistoryRepo.find({
						where: { userId },
						order: { createdAt: 'DESC' },
						take: 100,
					});

					const performanceMetrics = this.calculatePerformanceMetrics(gameHistory);

					const trends = this.analyticsCommon.buildTrends(gameHistory, {
						limit: 30,
					});

					const rankingData = {
						rank: 0,
						score: user.credits + user.purchasedCredits,
						percentile: 0,
						totalUsers: 0,
					};

					const credits = user.credits ?? 0;
					const purchasedCredits = user.purchasedCredits ?? 0;
					const freeQuestions = user.remainingFreeQuestions ?? 0;
					const totalCredits = credits + purchasedCredits + freeQuestions;

					return {
						basic: {
							userId: user.id,
							email: user.email,
							credits,
							purchasedCredits,
							totalCredits,
							createdAt: user.createdAt,
							accountAge: user.createdAt
								? Math.floor((Date.now() - user.createdAt.getTime()) / TIME_PERIODS_MS.DAY)
								: 0,
						},
						game: {
							userId: gameAnalytics.userId,
							totalGames: gameAnalytics.totalGames ?? 0,
							totalQuestionsAnswered: gameAnalytics.totalQuestionsAnswered ?? 0,
							successRate: gameAnalytics.successRate ?? 0,
							averageScore: gameAnalytics.averageScore ?? 0,
							bestScore: Math.round(gameAnalytics.bestScore ?? 0),
							totalPlayTime: gameAnalytics.totalPlayTime ?? 0,
							correctAnswers: gameAnalytics.correctAnswers ?? 0,
							averageTimePerQuestion: gameAnalytics.averageTimePerQuestion ?? 0,
							topicsPlayed: gameAnalytics.topicsPlayed ?? {},
							difficultyBreakdown: (() => {
								const breakdown: DifficultyBreakdown = {};
								const entries = gameAnalytics.difficultyBreakdown ?? {};
								for (const [key, value] of Object.entries(entries)) {
									if (isGameDifficulty(key)) {
										if (value != null) {
											breakdown[key] = {
												total: value.total,
												correct: value.correct,
												successRate: value.successRate ?? 0,
											};
										}
									}
								}
								return breakdown;
							})(),
							recentActivity: gameAnalytics.recentActivity ?? [],
						},
						performance: performanceMetrics,
						ranking: rankingData,
						trends,
					};
				},
				900,
				isCompleteUserAnalyticsData
			);
		} catch (error) {
			logger.analyticsError('getUserAnalytics', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async getUserStatistics(userId: string): Promise<AnalyticsResponse<UserAnalyticsRecord>> {
		const stats = await this.getUserStats(userId);
		return this.analyticsCommon.createAnalyticsResponse(stats);
	}

	async getUserPerformance(userId: string): Promise<AnalyticsResponse<UserPerformanceMetrics>> {
		const { history } = await this.fetchUserWithHistory(userId);
		const performance = this.calculatePerformanceMetrics(history);
		return this.analyticsCommon.createAnalyticsResponse(performance);
	}

	async getUserProgress(params: GetUserAnalyticsParams): Promise<AnalyticsResponse<UserProgressAnalytics>> {
		const { userId, query } = params;
		const { history } = await this.fetchUserWithHistory(userId);
		const filteredHistory = this.filterHistoryByDate(history, query);
		const progress = this.buildUserProgressAnalytics(filteredHistory, query);
		return this.analyticsCommon.createAnalyticsResponse(progress);
	}

	async getUserActivity(params: GetUserAnalyticsParams): Promise<AnalyticsResponse<ActivityEntry[]>> {
		const { userId, query } = params;
		const { history } = await this.fetchUserWithHistory(userId);
		const filteredHistory = this.filterHistoryByDate(history, query);
		const entries = this.buildUserActivityEntries(filteredHistory, query?.limit);
		return this.analyticsCommon.createAnalyticsResponse(entries);
	}

	async getUserInsights(userId: string): Promise<AnalyticsResponse<UserInsightsData>> {
		const stats = await this.getUserStats(userId);
		const { history } = await this.fetchUserWithHistory(userId);
		const performance = this.calculatePerformanceMetrics(history);
		const progress = this.buildUserProgressAnalytics(history);
		const insights = this.buildUserInsights(stats, performance, progress.topics);
		return this.analyticsCommon.createAnalyticsResponse(insights);
	}

	async getUserRecommendations(userId: string): Promise<AnalyticsResponse<SystemRecommendation[]>> {
		const stats = await this.getUserStats(userId);
		const { history } = await this.fetchUserWithHistory(userId);
		const performance = this.calculatePerformanceMetrics(history);
		const progress = this.buildUserProgressAnalytics(history);
		const recommendations = this.buildUserRecommendations(stats, performance, progress.topics);
		const systemRecommendations = await this.systemAnalyticsService.getSystemRecommendations();
		const combined = [...recommendations, ...systemRecommendations.slice(0, 2)];
		return this.analyticsCommon.createAnalyticsResponse(combined);
	}

	async getUserAchievements(userId: string): Promise<AnalyticsResponse<Achievement[]>> {
		const stats = await this.getUserStats(userId);
		const { user, history } = await this.fetchUserWithHistory(userId);
		const performance = this.calculatePerformanceMetrics(history);
		const generated = this.buildUserAchievements(stats, performance, history);
		const existing = Array.isArray(user.achievements) ? user.achievements : [];
		const merged = new Map<string, Achievement>();
		existing.forEach(achievement => {
			if (achievement?.id) {
				merged.set(achievement.id, achievement);
			}
		});
		generated.forEach(achievement => {
			if (achievement?.id && !merged.has(achievement.id)) {
				merged.set(achievement.id, achievement);
			}
		});
		const achievements = Array.from(merged.values()).sort((a, b) => {
			const timeA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
			const timeB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
			return timeB - timeA;
		});
		return this.analyticsCommon.createAnalyticsResponse(achievements);
	}

	async getUserTrends(params: GetUserAnalyticsParams): Promise<AnalyticsResponse<UserTrendPoint[]>> {
		const { userId, query } = params;
		const { history } = await this.fetchUserWithHistory(userId);
		const filteredHistory = this.filterHistoryByDate(history, query);
		const trends = this.analyticsCommon.buildTrends(filteredHistory, {
			groupBy: query?.groupBy,
			limit: query?.limit,
		});
		return this.analyticsCommon.createAnalyticsResponse(trends);
	}

	async compareUserPerformance(
		userId: string,
		query: ComparisonQueryOptions | undefined,
		getGameStats: () => Promise<{ averageScore: number; totalGames: number }>
	): Promise<AnalyticsResponse<UserComparisonResult>> {
		const stats = await this.getUserStats(userId);
		const { history } = await this.fetchUserWithHistory(userId);
		const filteredHistory = this.filterHistoryByDate(history, query);
		const performance = this.calculatePerformanceMetrics(filteredHistory);

		const targetPreference = query?.target ?? (query?.targetUserId ? ComparisonTarget.USER : ComparisonTarget.GLOBAL);
		if (targetPreference === ComparisonTarget.USER && !query?.targetUserId) {
			throw new BadRequestException(ERROR_CODES.TARGET_USER_ID_REQUIRED);
		}

		if (query?.targetUserId && !isUuid(query.targetUserId)) {
			throw new BadRequestException(ERROR_CODES.INVALID_USER_ID);
		}

		const result = await this.buildUserComparison(
			userId,
			stats,
			performance,
			filteredHistory,
			targetPreference === ComparisonTarget.USER ? query?.targetUserId : undefined,
			query,
			getGameStats
		);
		return this.analyticsCommon.createAnalyticsResponse(result);
	}

	async getUserSummary(params: GetUserSummaryParams): Promise<AnalyticsResponse<UserSummaryData>> {
		const { userId, includeActivity } = params;
		const stats = await this.getUserStats(userId);
		const { user, history } = await this.fetchUserWithHistory(userId);
		const performance = this.calculatePerformanceMetrics(history);
		const achievements = this.buildUserAchievements(stats, performance, history);
		const progress = this.buildUserProgressAnalytics(history);
		const insights = this.buildUserInsights(stats, performance, progress.topics);
		const summary = this.buildUserSummary(user, stats, performance, achievements, progress, insights);

		if (includeActivity) {
			const activityEntries = this.buildUserActivityEntries(history, 5);
			const activityHighlights = activityEntries.map(entry => {
				const detail = entry.detail ? ` - ${entry.detail}` : '';
				return `${new Date(entry.date).toLocaleDateString('en-GB')}: ${entry.action.replace(/_/g, ' ')}${detail}`;
			});
			const insightsSet = new Set(summary.insights);
			activityHighlights.forEach(highlight => insightsSet.add(highlight));
			summary.insights = Array.from(insightsSet).slice(0, 10);
		}

		return this.analyticsCommon.createAnalyticsResponse(summary);
	}

	private calculatePerformanceMetrics(gameHistory: GameHistoryEntity[]) {
		if (gameHistory.length === 0) {
			return {
				lastPlayed: new Date(),
				streakDays: 0,
				bestStreak: 0,
				improvementRate: 0,
				weakestTopic: '',
				strongestTopic: '',
				averageGameTime: 0,
				consistencyScore: 0,
				learningCurve: 0,
			};
		}

		const lastPlayed = gameHistory[0]?.createdAt ?? new Date();

		const streakData = calculateStreak(gameHistory);

		const improvementRate = this.calculateAdvancedImprovementRate(gameHistory);

		const topicPerformance = calculateCategoryPerformance(gameHistory, 'topic');
		const topicCounts = new Map<string, number>();
		for (const game of gameHistory) {
			if (game.topic) {
				topicCounts.set(game.topic, (topicCounts.get(game.topic) ?? 0) + 1);
			}
		}
		const topicsWithMinGames = Object.keys(topicPerformance).filter(topic => (topicCounts.get(topic) ?? 0) >= 3);

		const { strongestTopic, weakestTopic } = this.findTopicExtremes(topicsWithMinGames, topicPerformance);

		const averageGameTime = this.calculateAverageGameTime(gameHistory);
		const consistencyScore = this.calculateConsistencyScore(gameHistory);
		const learningCurve = this.calculateLearningCurve(gameHistory);

		return {
			lastPlayed,
			streakDays: streakData.current,
			bestStreak: streakData.best,
			improvementRate,
			weakestTopic,
			strongestTopic,
			averageGameTime,
			consistencyScore,
			learningCurve,
		};
	}

	private async fetchUserWithHistory(userId: string): Promise<UserWithHistoryResult> {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) {
			throw createNotFoundError('User');
		}

		const history = await this.gameHistoryRepo.find({
			where: { userId },
			order: { createdAt: 'DESC' },
		});

		return { user, history };
	}

	private filterHistoryByDate(history: GameHistoryEntity[], options?: HistoryFilterOptions): GameHistoryEntity[] {
		if (!options?.startDate && !options?.endDate) {
			return history;
		}

		const validStart = options?.startDate && !Number.isNaN(options.startDate.getTime()) ? options.startDate : undefined;
		const validEnd = options?.endDate && !Number.isNaN(options.endDate.getTime()) ? options.endDate : undefined;

		return history.filter(game => {
			const createdAt = game.createdAt ? new Date(game.createdAt) : undefined;
			if (!createdAt) {
				return false;
			}

			if (validStart && createdAt < validStart) {
				return false;
			}

			if (validEnd) {
				const endOfDay = new Date(validEnd);
				endOfDay.setHours(23, 59, 59, 999);
				if (createdAt > endOfDay) {
					return false;
				}
			}

			return true;
		});
	}

	private buildUserActivityEntries(history: GameHistoryEntity[], limit?: number): ActivityEntry[] {
		const effectiveLimit = limit && limit > 0 ? Math.min(Math.floor(limit), 200) : 50;
		const boundedHistory = history.slice(0, effectiveLimit);

		return boundedHistory.map(game => ({
			date: (game.createdAt ?? new Date()).toISOString(),
			action: 'game_completed',
			detail: `Score ${game.score ?? 0} / ${game.gameQuestionCount ?? 0} (${game.correctAnswers ?? 0} correct)`,
			topic: game.topic ?? undefined,
			durationSeconds: game.timeSpent ?? undefined,
		}));
	}

	private findTopicExtremes(
		topics: string[],
		performance: CountRecord
	): { strongestTopic: string; weakestTopic: string } {
		if (topics.length === 0) {
			return { strongestTopic: '', weakestTopic: '' };
		}
		const firstTopic = topics[0];
		if (!firstTopic) {
			return { strongestTopic: '', weakestTopic: '' };
		}
		let strongestTopic = firstTopic;
		let weakestTopic = firstTopic;
		let strongestValue = performance[firstTopic] ?? 0;
		let weakestValue = performance[firstTopic] ?? 0;

		for (const topic of topics) {
			const value = performance[topic] ?? 0;
			if (value > strongestValue) {
				strongestValue = value;
				strongestTopic = topic;
			}
			if (value < weakestValue) {
				weakestValue = value;
				weakestTopic = topic;
			}
		}

		return { strongestTopic, weakestTopic };
	}

	private buildUserProgressAnalytics(
		gameHistory: GameHistoryEntity[],
		trendOptions?: TrendQueryOptions
	): UserProgressAnalytics {
		const topicsMap = new Map<string, TopicAnalyticsAccumulator>();

		let totalQuestionsAnswered = 0;
		let totalCorrect = 0;

		gameHistory.forEach(game => {
			const topic = game.topic ?? 'Unknown';
			let entry = topicsMap.get(topic);
			if (!entry) {
				entry = {
					gamesPlayed: 0,
					totalQuestionsAnswered: 0,
					correctAnswers: 0,
					totalTimeSpent: 0,
					lastPlayed: null,
					difficultyBreakdown: {},
				};
				topicsMap.set(topic, entry);
			}

			entry.gamesPlayed += 1;
			entry.totalQuestionsAnswered += game.gameQuestionCount ?? 0;
			entry.correctAnswers += game.correctAnswers ?? 0;
			entry.totalTimeSpent += game.timeSpent ?? 0;

			const playedAt = game.createdAt ? new Date(game.createdAt).toISOString() : null;
			if (playedAt && (!entry.lastPlayed || playedAt > entry.lastPlayed)) {
				entry.lastPlayed = playedAt;
			}

			const difficulty = game.difficulty ?? 'unknown';
			entry.difficultyBreakdown[difficulty] = (entry.difficultyBreakdown[difficulty] ?? 0) + 1;

			topicsMap.set(topic, entry);

			totalQuestionsAnswered += game.gameQuestionCount ?? 0;
			totalCorrect += game.correctAnswers ?? 0;
		});

		const topics: UserProgressTopic[] = Array.from(topicsMap.entries())
			.map(([topic, value]) => {
				const successRate = calculateSuccessRate(value.totalQuestionsAnswered, value.correctAnswers);
				const averageResponseTime =
					value.totalQuestionsAnswered > 0 ? value.totalTimeSpent / value.totalQuestionsAnswered : 0;

				return {
					topic,
					gamesPlayed: value.gamesPlayed,
					totalQuestionsAnswered: value.totalQuestionsAnswered,
					correctAnswers: value.correctAnswers,
					successRate,
					averageResponseTime,
					lastPlayed: value.lastPlayed,
					difficultyBreakdown: value.difficultyBreakdown,
				};
			})
			.sort((a, b) => b.gamesPlayed - a.gamesPlayed);

		return {
			topics,
			timeline: this.analyticsCommon.buildTrends(gameHistory, {
				groupBy: trendOptions?.groupBy,
				limit: trendOptions?.limit,
			}),
			totals: {
				gamesPlayed: gameHistory.length,
				questionsAnswered: totalQuestionsAnswered,
				correctAnswers: totalCorrect,
			},
		};
	}

	private buildUserInsights(
		stats: UserAnalyticsRecord,
		performance: UserPerformanceMetrics,
		topics: UserProgressTopic[]
	): UserInsightsData {
		const strengths: string[] = [];
		const improvements: string[] = [];
		const recentHighlights: string[] = [];

		topics.slice(0, 5).forEach(topic => {
			if (topic.successRate >= 75) {
				strengths.push(`${topic.topic}: ${topic.successRate.toFixed(1)}% הצלחה (${topic.gamesPlayed} משחקים)`);
			} else if (topic.successRate <= 55 && topic.gamesPlayed >= 3) {
				improvements.push(`${topic.topic}: ${topic.successRate.toFixed(1)}% הצלחה – מומלץ להתאמן`);
			}
		});

		(stats.recentActivity ?? []).slice(0, 3).forEach(activity => {
			const action = activity.action.replace(/_/g, ' ');
			const detail = activity.detail ? ` (${activity.detail})` : '';
			recentHighlights.push(`${new Date(activity.date).toLocaleDateString('en-GB')} – ${action}${detail}`);
		});

		if (performance.bestStreak && performance.bestStreak >= 5) {
			strengths.unshift(`רצף שיא של ${performance.bestStreak} ימים רצופים במשחק`);
		}

		if (performance.weakestTopic) {
			improvements.push(`נושא לשיפור: ${performance.weakestTopic}`);
		}

		if (recentHighlights.length === 0 && stats.totalGames > 0) {
			recentHighlights.push('המשחק האחרון הושלם בהצלחה – המשך כך!');
		}

		return {
			strengths,
			improvements,
			recentHighlights,
		};
	}

	private buildUserRecommendations(
		stats: UserAnalyticsRecord,
		performance: UserPerformanceMetrics,
		topics: UserProgressTopic[]
	): SystemRecommendation[] {
		const recommendations: SystemRecommendation[] = [];

		if (stats.successRate < 60) {
			recommendations.push({
				id: 'user-rec-success-rate',
				type: 'performance',
				title: 'דיוק נמוך במענה',
				description: `שיעור ההצלחה הנוכחי שלך הוא ${stats.successRate.toFixed(1)}%.`,
				message: 'נסה לפתור חידות ברמת קושי קלה יותר כדי לצבור ביטחון.',
				action: 'התחל בסדרת משחקים בנושאים המועדפים עליך ברמת קל.',
				priority: 'medium',
				estimatedImpact: 'שיפור מדורג בדיוק התשובות',
				implementationEffort: 'low',
			});
		}

		const slowTopics = topics
			.filter(topic => topic.averageResponseTime > 20)
			.slice(0, 2)
			.map(topic => topic.topic);

		if (slowTopics.length > 0) {
			recommendations.push({
				id: 'user-rec-time-management',
				type: 'performance',
				title: 'תזמון המענה ארוך מהרגיל',
				description: `זמן המענה הממוצע שלך גבוה במיוחד בנושאים: ${slowTopics.join(', ')}.`,
				message: 'תרגל משחקים עם מגבלת זמן כדי לחדד את המהירות.',
				action: 'שחק במצב "Time Attack" בנושאים אלו פעמיים ביום.',
				priority: 'medium',
				estimatedImpact: 'שיפור קצב פתרון החידות',
				implementationEffort: 'medium',
			});
		}

		if (performance.streakDays < 3 && stats.totalGames >= 3) {
			recommendations.push({
				id: 'user-rec-engagement',
				type: 'engagement',
				title: 'שמור על רצף משחקים',
				description: 'רצף הימים הפעיל שלך קצר יחסית.',
				message: 'כדי לשפר את הרצף, מומלץ לשחק לפחות משחק קצר אחד בכל יום.',
				action: 'קבע תזכורת יומית למשחק קצר של חמש שאלות.',
				priority: 'low',
				estimatedImpact: 'הגברת המעורבות היומיומית',
				implementationEffort: 'low',
			});
		}

		return recommendations;
	}

	private buildUserAchievements(
		stats: UserAnalyticsRecord,
		performance: UserPerformanceMetrics,
		gameHistory: GameHistoryEntity[]
	): Achievement[] {
		const achievements: Achievement[] = [];
		const lastPlayed = gameHistory[0]?.createdAt ? new Date(gameHistory[0].createdAt).toISOString() : undefined;

		if (stats.totalGames >= 1) {
			achievements.push({
				id: 'ach-first-game',
				name: 'משחק ראשון',
				description: 'סיימת את המשחק הראשון שלך ב-EveryTriv',
				icon: 'trophy',
				unlockedAt: lastPlayed,
				category: 'engagement',
				points: 50,
			});
		}

		if (stats.successRate >= 80 && stats.totalQuestionsAnswered >= 20) {
			achievements.push({
				id: 'ach-accuracy-master',
				name: 'אמן הדיוק',
				description: `שיעור הצלחה של ${stats.successRate.toFixed(1)}% ב-${stats.totalQuestionsAnswered} שאלות`,
				icon: 'target',
				unlockedAt: lastPlayed,
				category: 'performance',
				points: 150,
			});
		}

		if (performance.bestStreak >= 5) {
			achievements.push({
				id: 'ach-streak-hero',
				name: 'גיבור הרצף',
				description: `רצף שיא של ${performance.bestStreak} ימים רצופים.`,
				icon: 'fire',
				unlockedAt: lastPlayed,
				category: 'engagement',
				points: 120,
			});
		}

		const topTopic = Object.entries(stats.topicsPlayed ?? {}).sort((a, b) => b[1] - a[1])[0];
		if (topTopic && topTopic[1] >= 5) {
			achievements.push({
				id: 'ach-topic-specialist',
				name: 'מומחה נושא',
				description: `שיחקת לפחות ${topTopic[1]} משחקים בנושא ${topTopic[0]}`,
				icon: 'book',
				unlockedAt: lastPlayed,
				category: 'knowledge',
				points: 100,
			});
		}

		return achievements;
	}

	private async buildUserComparison(
		userId: string,
		stats: UserAnalyticsRecord,
		performance: UserPerformanceMetrics,
		history: GameHistoryEntity[],
		targetUserId: string | undefined,
		query: ComparisonQueryOptions | undefined,
		getGameStats: () => Promise<{ averageScore: number; totalGames: number }>
	): Promise<UserComparisonResult> {
		const userMetrics: UserComparisonMetrics = {
			successRate: stats.successRate ?? 0,
			averageScore: stats.averageScore ?? 0,
			totalGames: stats.totalGames ?? history.length,
			bestStreak: performance.bestStreak,
			streakDays: performance.streakDays,
			improvementRate: performance.improvementRate,
			consistencyScore: performance.consistencyScore,
		};

		let targetMetrics: UserComparisonMetrics;
		let targetType: ComparisonTarget = ComparisonTarget.GLOBAL;
		let resolvedTargetUserId: string | undefined;

		if (targetUserId != null && targetUserId !== userId) {
			try {
				const targetStats = await this.getUserStats(targetUserId);
				const { history: targetHistory } = await this.fetchUserWithHistory(targetUserId);
				const filteredTargetHistory = this.filterHistoryByDate(targetHistory, query);
				const targetPerformance = this.calculatePerformanceMetrics(filteredTargetHistory);
				targetMetrics = {
					successRate: targetStats.successRate ?? 0,
					averageScore: targetStats.averageScore ?? 0,
					totalGames: targetStats.totalGames ?? filteredTargetHistory.length,
					bestStreak: targetPerformance.bestStreak,
					streakDays: targetPerformance.streakDays,
					improvementRate: targetPerformance.improvementRate,
					consistencyScore: targetPerformance.consistencyScore,
				};
				targetType = ComparisonTarget.USER;
				resolvedTargetUserId = targetUserId;
			} catch (error) {
				logger.analyticsError('buildUserComparison target user', {
					errorInfo: { message: getErrorMessage(error) },
					userIds: {
						target: targetUserId,
					},
				});
				throw error;
			}
		} else {
			try {
				const globalStats = await getGameStats();
				targetMetrics = {
					successRate: globalStats.averageScore,
					averageScore: globalStats.averageScore,
					totalGames: globalStats.totalGames,
				};
			} catch (error) {
				logger.analyticsError('buildUserComparison global stats', {
					errorInfo: { message: getErrorMessage(error) },
				});
				throw error;
			}
		}

		const differences: UserComparisonMetrics = {
			successRate: userMetrics.successRate - targetMetrics.successRate,
			averageScore: userMetrics.averageScore - targetMetrics.averageScore,
			totalGames: userMetrics.totalGames - targetMetrics.totalGames,
			rank: userMetrics.rank != null && targetMetrics.rank != null ? userMetrics.rank - targetMetrics.rank : undefined,
			percentile:
				userMetrics.percentile != null && targetMetrics.percentile != null
					? userMetrics.percentile - targetMetrics.percentile
					: undefined,
			bestStreak:
				userMetrics.bestStreak != null && targetMetrics.bestStreak != null
					? userMetrics.bestStreak - targetMetrics.bestStreak
					: undefined,
			streakDays:
				userMetrics.streakDays != null && targetMetrics.streakDays != null
					? userMetrics.streakDays - targetMetrics.streakDays
					: undefined,
			improvementRate:
				userMetrics.improvementRate != null && targetMetrics.improvementRate != null
					? userMetrics.improvementRate - targetMetrics.improvementRate
					: undefined,
			consistencyScore:
				userMetrics.consistencyScore != null && targetMetrics.consistencyScore != null
					? (userMetrics.consistencyScore ?? 0) - (targetMetrics.consistencyScore ?? 0)
					: undefined,
		};

		return {
			userId,
			target: targetType,
			targetUserId: resolvedTargetUserId,
			userMetrics,
			targetMetrics,
			differences,
		};
	}

	private buildUserSummary(
		user: UserEntity,
		stats: UserAnalyticsRecord,
		performance: UserPerformanceMetrics,
		achievements: Achievement[],
		progress: UserProgressAnalytics,
		insights: UserInsightsData
	): UserSummaryData {
		const credits = user.credits ?? 0;
		const purchasedCredits = user.purchasedCredits ?? 0;
		const freeQuestions = user.remainingFreeQuestions ?? 0;
		const totalCredits = credits + purchasedCredits + freeQuestions;

		const basicInfo = {
			userId: user.id,
			email: user.email,
			credits,
			purchasedCredits,
			totalCredits,
			createdAt: user.createdAt,
			accountAge: user.createdAt ? Math.floor((Date.now() - user.createdAt.getTime()) / TIME_PERIODS_MS.DAY) : 0,
		};

		const topTopics = progress.topics.slice(0, 3).map(topic => topic.topic);
		const mergedInsights = [
			...insights.strengths.slice(0, 2),
			...insights.recentHighlights.slice(0, 1),
			...insights.improvements.slice(0, 1),
		].filter(Boolean);

		return {
			user: basicInfo,
			highlights: {
				totalGames: stats.totalGames,
				bestScore: Math.round(stats.bestScore),
				topTopics,
				achievementsUnlocked: achievements.length,
			},
			performance,
			insights: mergedInsights,
		};
	}

	private async calculateUserStats(userId: string): Promise<UserAnalyticsRecord> {
		try {
			let userStats = await this.userStatsRepo.findOne({
				where: { userId },
			});

			if (!userStats) {
				userStats = this.userStatsRepo.create({
					userId,
				});
				await this.userStatsRepo.save(userStats);
			}

			const recentGames = await this.gameHistoryRepo.find({
				where: { userId },
				order: { createdAt: 'DESC' },
				take: 10,
			});

			const recentScores = recentGames.reduce((sum, game) => sum + game.score, 0);
			const averageScore = recentGames.length > 0 ? recentScores / recentGames.length : 0;

			const topicsInStats = userStats.topicStats ? Object.keys(userStats.topicStats) : [];
			const queryBuilder = this.gameHistoryRepo
				.createQueryBuilder('game')
				.select('game.topic', 'topic')
				.addSelect('CAST(COUNT(*) AS INTEGER)', 'count')
				.where('game.userId = :userId', { userId })
				.andWhere(`game.topic ${SQL_CONDITIONS.IS_NOT_NULL}`)
				.andWhere("game.topic != ''");

			if (topicsInStats.length > 0) {
				queryBuilder.andWhere('game.topic IN (:...topics)', {
					topics: topicsInStats,
				});
			}

			queryBuilder.groupBy('game.topic').orderBy('COUNT(*)', 'DESC');

			const topicCounts = await queryBuilder.getRawMany<TopicCountRecord>();

			const topicsPlayed: CountRecord = {};
			topicCounts.forEach(({ topic, count }) => {
				if (topic && count != null) {
					topicsPlayed[topic] = count;
				}
			});

			const mostPlayedTopicKeys = Object.keys(topicsPlayed);
			const { strongestTopic } = this.findTopicExtremes(mostPlayedTopicKeys, topicsPlayed);
			const mostPlayedTopic = strongestTopic || 'None';

			const difficultiesInStats = userStats.difficultyStats ? Object.keys(userStats.difficultyStats) : [];
			const difficultyQueryBuilder = this.gameHistoryRepo
				.createQueryBuilder('game')
				.select('game.difficulty', 'difficulty')
				.addSelect('CAST(COUNT(*) AS INTEGER)', 'total')
				.addSelect('CAST(COALESCE(SUM(game.correctAnswers), 0) AS INTEGER)', 'correct')
				.where('game.userId = :userId', { userId })
				.andWhere(`game.difficulty ${SQL_CONDITIONS.IS_NOT_NULL}`)
				.andWhere("game.difficulty != ''");

			if (difficultiesInStats.length > 0) {
				difficultyQueryBuilder.andWhere('game.difficulty IN (:...difficulties)', { difficulties: difficultiesInStats });
			}

			difficultyQueryBuilder.groupBy('game.difficulty');

			const difficultyStatsRaw = await difficultyQueryBuilder.getRawMany<DifficultyStatsRaw>();

			const difficultyBreakdown: DifficultyBreakdown = {};
			difficultyStatsRaw.forEach(({ difficulty, total, correct }) => {
				if (difficulty != null && isGameDifficulty(difficulty) && total != null && correct != null) {
					difficultyBreakdown[difficulty] = {
						total,
						correct,
						successRate: calculateSuccessRate(total, correct),
					};
				}
			});

			const recentActivity = recentGames.map(game => ({
				date: (game.createdAt ?? new Date()).toISOString(),
				action: 'game_completed',
				detail: `Score: ${game.score}, Topic: ${game.topic}`,
				topic: game.topic,
				durationSeconds: game.timeSpent,
			}));

			return {
				userId,
				totalGames: userStats.totalGames,
				totalQuestionsAnswered: userStats.totalQuestionsAnswered,
				successRate: Number(userStats.overallSuccessRate),
				averageScore,
				bestScore: Math.round(userStats.bestGameScore),
				totalPlayTime: userStats.totalPlayTime,
				correctAnswers: userStats.correctAnswers,
				mostPlayedTopic,
				averageTimePerQuestion: userStats.averageTimePerQuestion,
				totalScore: recentScores,
				topicsPlayed,
				difficultyBreakdown,
				recentActivity,
			};
		} catch (error) {
			logger.analyticsError('calculateUserStats', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	private calculateAdvancedImprovementRate(gameHistory: GameHistoryEntity[]) {
		if (gameHistory.length < 4) return 0;

		const sortedHistory = [...gameHistory].sort(
			(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		);

		const quarterSize = Math.floor(sortedHistory.length / 4);
		const firstQuarter = sortedHistory.slice(0, quarterSize);
		const lastQuarter = sortedHistory.slice(-quarterSize);

		const firstQuarterTotal = firstQuarter.reduce((sum, game) => sum + (game.gameQuestionCount ?? 0), 0);
		const firstQuarterCorrect = firstQuarter.reduce((sum, game) => sum + (game.correctAnswers ?? 0), 0);
		const firstQuarterSuccessRate = calculateSuccessRate(firstQuarterTotal, firstQuarterCorrect);
		const lastQuarterTotal = lastQuarter.reduce((sum, game) => sum + (game.gameQuestionCount ?? 0), 0);
		const lastQuarterCorrect = lastQuarter.reduce((sum, game) => sum + (game.correctAnswers ?? 0), 0);
		const lastQuarterSuccessRate = calculateSuccessRate(lastQuarterTotal, lastQuarterCorrect);

		const improvement = lastQuarterSuccessRate - firstQuarterSuccessRate;

		const recentGames = sortedHistory.slice(-10);
		const trend = this.calculateTrend(recentGames);

		return improvement + trend * 0.1;
	}

	private calculateAverageGameTime(gameHistory: GameHistoryEntity[]) {
		if (gameHistory.length === 0) return 0;

		const totalTime = gameHistory.reduce((sum, game) => sum + (game.timeSpent ?? 0), 0);
		return Math.round(totalTime / gameHistory.length / 60);
	}

	private calculateConsistencyScore(gameHistory: GameHistoryEntity[]) {
		if (gameHistory.length < 3) return 0;

		const successRates = gameHistory.map(game => calculateSuccessRate(game.gameQuestionCount, game.correctAnswers));

		const mean = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
		const variance = successRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / successRates.length;
		const standardDeviation = Math.sqrt(variance);

		const consistencyScore = Math.max(0, 100 - standardDeviation * 2);
		return Math.round(consistencyScore);
	}

	private calculateLearningCurve(gameHistory: GameHistoryEntity[]) {
		if (gameHistory.length < 5) return 0;

		const sortedHistory = [...gameHistory].sort(
			(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		);

		const segmentSize = Math.max(1, Math.floor(sortedHistory.length / 5));
		const segments = [];

		for (let i = 0; i < 5; i++) {
			const start = i * segmentSize;
			const end = Math.min(start + segmentSize, sortedHistory.length);
			const segment = sortedHistory.slice(start, end);
			const segmentTotal = segment.reduce((sum, game) => sum + (game.gameQuestionCount ?? 0), 0);
			const segmentCorrect = segment.reduce((sum, game) => sum + (game.correctAnswers ?? 0), 0);
			segments.push(calculateSuccessRate(segmentTotal, segmentCorrect));
		}

		let improvement = 0;
		for (let i = 1; i < segments.length; i++) {
			const current = segments[i] ?? 0;
			const previous = segments[i - 1] ?? 0;
			improvement += current - previous;
		}

		const learningCurve = Math.max(0, Math.min(100, 50 + improvement * 2));
		return Math.round(learningCurve);
	}

	private calculateTrend(recentGames: GameHistoryEntity[]) {
		if (recentGames.length < 3) return 0;

		const successRates = recentGames.map(game => {
			const questionCount = game.gameQuestionCount ?? 0;
			const correctAnswers = game.correctAnswers ?? 0;
			return calculateSuccessRate(questionCount, correctAnswers);
		});

		let sumX = 0,
			sumY = 0,
			sumXY = 0,
			sumXX = 0;
		const n = successRates.length;

		for (let i = 0; i < n; i++) {
			const rate = successRates[i] ?? 0;
			sumX += i;
			sumY += rate;
			sumXY += i * rate;
			sumXX += i * i;
		}

		const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
		return Math.max(-1, Math.min(1, slope / 10));
	}
}
