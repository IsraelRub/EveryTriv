import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	ComparisonTarget,
	ERROR_CODES,
	SERVER_CACHE_KEYS,
	TIME_DURATIONS_SECONDS,
	TIME_PERIODS_MS,
	TimePeriod,
} from '@shared/constants';
import type {
	Achievement,
	AchievementCalculationContext,
	ActivityEntry,
	AnalyticsResponse,
	CategoryStatistics,
	ComparisonQueryOptions,
	CompleteUserAnalytics,
	CountRecord,
	DifficultyBreakdown,
	GameStatsSummary,
	HistoryFilterOptions,
	SavedAchievement,
	SystemRecommendation,
	TrendQueryOptions,
	UnifiedUserAnalyticsResponse,
	UserAnalyticsRecord,
	UserComparisonMetrics,
	UserComparisonResult,
	UserInsightsData,
	UserPerformanceMetrics,
	UserProgressAnalytics,
	UserProgressTopic,
	UserSummaryData,
} from '@shared/types';
import { calculateSuccessRate, formatDate, getErrorMessage } from '@shared/utils';
import {
	buildAchievementFromSaved,
	buildAllAchievements,
	convertToSavedAchievement,
	isAnalyticsResponseUnifiedUserAnalytics,
	isCompleteUserAnalyticsData,
} from '@shared/utils/domain';
import { isGameDifficulty, isUuid } from '@shared/validation';

import { GameHistoryEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { TopicAnalyticsAccumulator, UserWithHistoryResult } from '@internal/types';
import { calculateCategoryPerformance, calculateStreak, createNotFoundError } from '@internal/utils';

import { AnalyticsCommonService } from './common-analytics.service';
import { SystemAnalyticsService } from './system-analytics.service';
import { buildUnifiedQuerySignature } from './unifiedAnalyticsCache.utils';

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

					// Optimize: fetch only 30 games for trends (instead of 100)
					const gameHistory = await this.gameHistoryRepo.find({
						where: { userId },
						order: { createdAt: 'DESC' },
						take: 30,
					});

					const performanceMetrics = this.calculatePerformanceMetrics(gameHistory);

					const trends = this.analyticsCommon.buildTrends(gameHistory, {
						limit: 30,
					});

					const rankingData = {
						rank: 0,
						score: (user.credits ?? 0) + user.purchasedCredits,
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

	async getUnifiedUserAnalytics(
		userId: string,
		includeSections?: string[],
		options?: {
			startDate?: Date;
			endDate?: Date;
			groupBy?: TimePeriod;
			activityLimit?: number;
			trendLimit?: number;
			includeActivity?: boolean;
			targetUserId?: string;
			comparisonTarget?: ComparisonTarget;
			getGameStats?: () => Promise<GameStatsSummary>;
		}
	): Promise<AnalyticsResponse<UnifiedUserAnalyticsResponse>> {
		const querySig = buildUnifiedQuerySignature(includeSections, options);
		const cacheKey = SERVER_CACHE_KEYS.ANALYTICS.USER_UNIFIED(userId, querySig);
		try {
			return await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					const sections =
						includeSections && includeSections.length > 0 ? includeSections : ['statistics', 'performance'];
					const includeSet = new Set(sections.map(s => s.toLowerCase()));

					const response: UnifiedUserAnalyticsResponse = {};

					// Fetch common data once
					let stats: UserAnalyticsRecord | undefined;
					let user: UserEntity | undefined;
					let history: GameHistoryEntity[] | undefined;
					let performance: UserPerformanceMetrics | undefined;
					let progress: UserProgressAnalytics | undefined;

					// Fetch stats if needed
					if (
						includeSet.has('statistics') ||
						includeSet.has('insights') ||
						includeSet.has('recommendations') ||
						includeSet.has('summary') ||
						includeSet.has('achievements') ||
						includeSet.has('comparison')
					) {
						stats = await this.getUserStats(userId);
						if (includeSet.has('statistics')) {
							response.statistics = stats;
						}
					}

					// Fetch user and history if needed
					if (
						includeSet.has('performance') ||
						includeSet.has('insights') ||
						includeSet.has('recommendations') ||
						includeSet.has('summary') ||
						includeSet.has('achievements') ||
						includeSet.has('trends') ||
						includeSet.has('activity') ||
						includeSet.has('progress') ||
						includeSet.has('comparison')
					) {
						const userWithHistory = await this.fetchUserWithHistory(userId);
						user = userWithHistory.user;
						history = userWithHistory.history;

						// Filter history by date if provided
						if (options?.startDate || options?.endDate) {
							history = this.filterHistoryByDate(history, {
								startDate: options.startDate,
								endDate: options.endDate,
							});
						}

						// Calculate performance if needed
						if (
							includeSet.has('performance') ||
							includeSet.has('insights') ||
							includeSet.has('recommendations') ||
							includeSet.has('summary') ||
							includeSet.has('achievements') ||
							includeSet.has('comparison')
						) {
							performance = this.calculatePerformanceMetrics(history);
							if (includeSet.has('performance')) {
								response.performance = performance;
							}
						}

						// Calculate progress if needed
						if (
							includeSet.has('progress') ||
							includeSet.has('insights') ||
							includeSet.has('recommendations') ||
							includeSet.has('summary')
						) {
							progress = this.buildUserProgressAnalytics(history, {
								groupBy: options?.groupBy,
								limit: options?.trendLimit,
							});
							if (includeSet.has('progress')) {
								response.progress = progress;
							}
						}
					}

					// Build insights if needed
					if (includeSet.has('insights') && stats && performance && progress) {
						response.insights = this.buildUserInsights(stats, performance, progress.topics);
					}

					// Build recommendations if needed
					if (includeSet.has('recommendations') && stats && performance && progress) {
						const recommendations = this.buildUserRecommendations(stats, performance, progress.topics);
						const systemRecommendations = await this.systemAnalyticsService.getSystemRecommendations();
						response.recommendations = [...recommendations, ...systemRecommendations.slice(0, 2)];
					}

					// Build achievements if needed
					if (includeSet.has('achievements') && stats && performance && user && history) {
						// Get saved achievements from database
						const savedAchievements: SavedAchievement[] = Array.isArray(user.achievements)
							? user.achievements.filter(ach => ach?.id && (ach.unlockedAt || ach.progress !== undefined))
							: [];

						// Build calculation context
						const context: AchievementCalculationContext = {
							totalGames: stats.totalGames,
							bestScore: stats.bestScore,
							successRate: stats.successRate,
							totalQuestionsAnswered: stats.totalQuestionsAnswered,
							streakDays: performance.streakDays,
							bestStreak: performance.bestStreak,
							topicsPlayed: stats.topicsPlayed ?? {},
						};

						// Build all achievements based on current stats
						const allComputedAchievements = buildAllAchievements(context);
						const lastPlayed = history[0]?.createdAt ? new Date(history[0].createdAt).toISOString() : undefined;

						// Create map of saved achievement IDs
						const savedIds = new Set(savedAchievements.map(ach => ach.id));

						// Merge: convert saved achievements to full achievements, then add computed ones
						const merged = new Map<string, Achievement>();

						// Convert saved achievements to full achievements (using saved points snapshot)
						for (const saved of savedAchievements) {
							const full = buildAchievementFromSaved(saved, context);
							if (full) {
								merged.set(full.id, full);
							}
						}

						// Add computed achievements (only if not already saved)
						// Mark new ones with unlockedAt
						for (const computed of allComputedAchievements) {
							if (!merged.has(computed.id)) {
								const isNew = !savedIds.has(computed.id);
								merged.set(computed.id, {
									...computed,
									unlockedAt: isNew ? lastPlayed : undefined,
								});
							}
						}

						response.achievements = Array.from(merged.values()).sort((a, b) => {
							const timeA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
							const timeB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
							return timeB - timeA;
						});

						// Save new achievements (those with unlockedAt that weren't saved before)
						const newAchievementsToSave: Achievement[] = Array.from(merged.values()).filter(
							ach => ach.unlockedAt && !savedIds.has(ach.id)
						);
						if (newAchievementsToSave.length > 0) {
							await this.saveNewAchievements(userId, newAchievementsToSave);
						}
					}

					// Build trends if needed
					if (includeSet.has('trends') && history) {
						response.trends = this.analyticsCommon.buildTrends(history, {
							groupBy: options?.groupBy,
							limit: options?.trendLimit,
						});
					}

					// Build activity if needed
					if (includeSet.has('activity') && history) {
						response.activity = this.buildUserActivityEntries(history, options?.activityLimit);
					}

					// Build summary if needed
					if (includeSet.has('summary') && stats && performance && user && history) {
						const savedAchievements: SavedAchievement[] = Array.isArray(user.achievements)
							? user.achievements.filter(ach => ach?.id && (ach.unlockedAt || ach.progress !== undefined))
							: [];

						// Build calculation context
						const context: AchievementCalculationContext = {
							totalGames: stats.totalGames,
							bestScore: stats.bestScore,
							successRate: stats.successRate,
							totalQuestionsAnswered: stats.totalQuestionsAnswered,
							streakDays: performance.streakDays,
							bestStreak: performance.bestStreak,
							topicsPlayed: stats.topicsPlayed ?? {},
						};

						// Build all achievements and convert saved ones to full achievements
						const allComputedAchievements = buildAllAchievements(context);
						const savedIds = new Set(savedAchievements.map(ach => ach.id));
						const achievements: Achievement[] = [];

						// Convert saved achievements to full achievements (using saved points snapshot)
						for (const saved of savedAchievements) {
							const full = buildAchievementFromSaved(saved, context);
							if (full) {
								achievements.push(full);
							}
						}

						// Add computed achievements (only if not already saved)
						for (const computed of allComputedAchievements) {
							if (!savedIds.has(computed.id)) {
								achievements.push(computed);
							}
						}
						const progressData = progress || this.buildUserProgressAnalytics(history);
						const insights = this.buildUserInsights(stats, performance, progressData.topics);
						const summary = this.buildUserSummary(user, stats, performance, achievements, progressData, insights);

						if (options?.includeActivity) {
							const activityEntries = this.buildUserActivityEntries(history, 5);
							const activityHighlights = activityEntries.map(entry => {
								const detail = entry.detail ? ` - ${entry.detail}` : '';
								return `${formatDate(entry.date)}: ${entry.action.replace(/_/g, ' ')}${detail}`;
							});
							const insightsSet = new Set(summary.insights);
							activityHighlights.forEach(highlight => insightsSet.add(highlight));
							summary.insights = Array.from(insightsSet).slice(0, 10);
						}

						response.summary = summary;
					}

					// Build comparison if needed
					if (includeSet.has('comparison') && stats && history && performance && options?.getGameStats) {
						const targetPreference =
							options.comparisonTarget ?? (options.targetUserId ? ComparisonTarget.USER : ComparisonTarget.GLOBAL);
						if (targetPreference === ComparisonTarget.USER && !options.targetUserId) {
							throw new BadRequestException(ERROR_CODES.TARGET_USER_ID_REQUIRED);
						}

						if (options.targetUserId && !isUuid(options.targetUserId)) {
							throw new BadRequestException(ERROR_CODES.INVALID_USER_ID);
						}

						const comparisonResult = await this.buildUserComparison(
							userId,
							stats,
							performance,
							history,
							targetPreference === ComparisonTarget.USER ? options.targetUserId : undefined,
							{
								startDate: options.startDate,
								endDate: options.endDate,
								target: options.comparisonTarget,
								targetUserId: options.targetUserId,
							},
							options.getGameStats
						);
						response.comparison = comparisonResult;
					}

					logger.apiRead(`analytics_user_unified [${sections.length} sections: ${sections.join(',')}]`, {
						userId,
						query: Object.keys(options || {}),
					});

					return this.analyticsCommon.createAnalyticsResponse(response);
				},
				TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES,
				isAnalyticsResponseUnifiedUserAnalytics
			);
		} catch (error) {
			const errorSections =
				includeSections && includeSections.length > 0 ? includeSections : ['statistics', 'performance'];
			logger.analyticsError(`getUnifiedUserAnalytics [${errorSections.length} sections: ${errorSections.join(',')}]`, {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				query: Object.keys(options || {}),
			});
			throw error;
		}
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
				strengths.push(`${topic.topic}: ${topic.successRate.toFixed(1)}% success (${topic.gamesPlayed} games)`);
			} else if (topic.successRate <= 55 && topic.gamesPlayed >= 3) {
				improvements.push(`${topic.topic}: ${topic.successRate.toFixed(1)}% success – recommended to practice`);
			}
		});

		(stats.recentActivity ?? []).slice(0, 3).forEach(activity => {
			const action = activity.action.replace(/_/g, ' ');
			const detail = activity.detail ? ` (${activity.detail})` : '';
			recentHighlights.push(`${formatDate(activity.date)} – ${action}${detail}`);
		});

		if (performance.bestStreak && performance.bestStreak >= 5) {
			strengths.unshift(`Best streak of ${performance.bestStreak} consecutive days of playing`);
		}

		if (performance.weakestTopic) {
			improvements.push(`Topic to improve: ${performance.weakestTopic}`);
		}

		if (recentHighlights.length === 0 && stats.totalGames > 0) {
			recentHighlights.push('Last game completed successfully – keep it up!');
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
				title: 'Low answer accuracy',
				description: `Your current success rate is ${stats.successRate.toFixed(1)}%.`,
				message: 'Try solving puzzles at an easier difficulty level to build confidence.',
				action: 'Start a series of games in your favorite topics at easy level.',
				priority: 'medium',
				estimatedImpact: 'Gradual improvement in answer accuracy',
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
				title: 'Response time longer than usual',
				description: `Your average response time is particularly high in topics: ${slowTopics.join(', ')}.`,
				message: 'Practice games with time limits to sharpen your speed.',
				action: 'Play in "Time Attack" mode in these topics twice a day.',
				priority: 'medium',
				estimatedImpact: 'Improved puzzle solving speed',
				implementationEffort: 'medium',
			});
		}

		if (performance.streakDays < 3 && stats.totalGames >= 3) {
			recommendations.push({
				id: 'user-rec-engagement',
				type: 'engagement',
				title: 'Maintain your game streak',
				description: 'Your active day streak is relatively short.',
				message: 'To improve your streak, it is recommended to play at least one short game every day.',
				action: 'Set a daily reminder for a short game of five questions.',
				priority: 'low',
				estimatedImpact: 'Increased daily engagement',
				implementationEffort: 'low',
			});
		}

		return recommendations;
	}

	private async saveNewAchievements(userId: string, newAchievements: Achievement[]): Promise<void> {
		try {
			const user = await this.userRepo.findOne({ where: { id: userId } });
			if (!user) {
				return;
			}

			const existing: SavedAchievement[] = Array.isArray(user.achievements) ? user.achievements : [];
			const existingMap = new Map<string, SavedAchievement>();
			existing.forEach(ach => {
				if (ach?.id) {
					existingMap.set(ach.id, ach);
				}
			});

			// Convert and add new achievements (only those with unlockedAt or progress)
			for (const ach of newAchievements) {
				if (ach?.id && (ach.unlockedAt || ach.progress !== undefined)) {
					existingMap.set(ach.id, convertToSavedAchievement(ach));
				}
			}

			user.achievements = Array.from(existingMap.values());
			await this.userRepo.save(user);

			logger.analyticsStats('achievements_saved', {
				userId,
				count: newAchievements.length,
			});
		} catch (error) {
			logger.analyticsError('Failed to save new achievements', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			// Don't throw - achievements are computed, saving is optional
		}
	}

	private async buildUserComparison(
		userId: string,
		stats: UserAnalyticsRecord,
		performance: UserPerformanceMetrics,
		history: GameHistoryEntity[],
		targetUserId: string | undefined,
		query: ComparisonQueryOptions | undefined,
		getGameStats: () => Promise<GameStatsSummary>
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

			// Calculate averageScore from UserStatsEntity (totalScore / totalGames)
			const averageScore =
				userStats.totalGames > 0 && userStats.totalScore !== undefined
					? userStats.totalScore / userStats.totalGames
					: 0;

			// Use topicStats from UserStatsEntity instead of querying GameHistory
			const topicsPlayed: CountRecord = {};
			if (userStats.topicStats) {
				Object.entries(userStats.topicStats).forEach(([topic, stats]) => {
					// Count total games per topic - we'll use totalQuestionsAnswered as a proxy
					// since topicStats doesn't directly store game count, we calculate it from questions
					topicsPlayed[topic] = stats.totalQuestionsAnswered || 0;
				});
			}

			// Calculate mostPlayedTopic from topicStats
			const mostPlayedTopic = this.calculateMostPlayedTopicFromStats(userStats.topicStats);

			// Use difficultyStats from UserStatsEntity instead of querying GameHistory
			const difficultyBreakdown: DifficultyBreakdown = {};
			if (userStats.difficultyStats) {
				Object.entries(userStats.difficultyStats).forEach(([difficulty, stats]) => {
					if (isGameDifficulty(difficulty)) {
						difficultyBreakdown[difficulty] = {
							total: stats.totalQuestionsAnswered || 0,
							correct: stats.correctAnswers || 0,
							successRate:
								stats.totalQuestionsAnswered > 0
									? calculateSuccessRate(stats.totalQuestionsAnswered, stats.correctAnswers)
									: undefined,
						};
					}
				});
			}

			// Use recentActivity from UserStatsEntity instead of querying GameHistory
			const recentActivity =
				userStats.recentActivity?.map(activity => ({
					date: new Date(activity.createdAt).toISOString(),
					action: 'game_completed',
					detail: `Score: ${activity.score}, Topic: ${activity.topic}`,
					topic: activity.topic,
					durationSeconds: activity.timeSpent,
				})) ?? [];

			return {
				userId,
				totalGames: userStats.totalGames,
				totalQuestionsAnswered: userStats.totalQuestionsAnswered,
				successRate: userStats.overallSuccessRate,
				averageScore,
				bestScore: Math.round(userStats.bestGameScore),
				totalPlayTime: userStats.totalPlayTime,
				correctAnswers: userStats.correctAnswers,
				mostPlayedTopic,
				averageTimePerQuestion: userStats.averageTimePerQuestion,
				totalScore: userStats.totalScore ?? 0,
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

	private calculateMostPlayedTopicFromStats(topicStats?: Record<string, CategoryStatistics>): string {
		if (!topicStats || Object.keys(topicStats).length === 0) {
			return 'None';
		}

		let mostPlayedTopic = '';
		let maxQuestionsAnswered = 0;

		Object.entries(topicStats).forEach(([topic, stats]) => {
			const questionsAnswered = stats.totalQuestionsAnswered || 0;
			if (questionsAnswered > maxQuestionsAnswered) {
				maxQuestionsAnswered = questionsAnswered;
				mostPlayedTopic = topic;
			}
		});

		return mostPlayedTopic || 'None';
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
		return Math.round(totalTime / gameHistory.length / TIME_DURATIONS_SECONDS.MINUTE);
	}

	private calculateConsistencyScore(gameHistory: GameHistoryEntity[]) {
		if (gameHistory.length < 3) return 0;

		const successRates = gameHistory.map(game => calculateSuccessRate(game.gameQuestionCount, game.correctAnswers));

		const mean = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
		const variance = successRates.reduce((sum, rate) => sum + (rate - mean) ** 2, 0) / successRates.length;
		const standardDeviation = variance ** 0.5;

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
