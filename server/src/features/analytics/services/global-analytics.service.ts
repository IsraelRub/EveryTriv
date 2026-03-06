import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { SERVER_CACHE_KEYS, TIME_DURATIONS_SECONDS, VALIDATION_COUNT } from '@shared/constants';
import type {
	AnalyticsResponse,
	CountRecord,
	DifficultyBreakdown,
	DifficultyStatsRaw,
	GameAnalyticsQuery,
	GameStatsData,
	GameStatsSummary,
	GlobalStatsResponse,
	TopicAnalyticsRecord,
	TopicStatsData,
	TrendQueryOptions,
	UserTrendPoint,
} from '@shared/types';
import {
	buildCountRecord,
	calculateScoreRate,
	clamp,
	ensureErrorObject,
	getErrorMessage,
	hasProperty,
	isRecord,
} from '@shared/utils';
import { isGameDifficulty, VALIDATORS } from '@shared/validation';

import { SQL_CONDITIONS } from '@internal/constants';
import { GameHistoryEntity, UserEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { DifficultyStatsRecord, NumericQueryResult, UserIdSuccessRateRecord } from '@internal/types';
import { addDateRangeConditions, computeMeanVarianceStddev } from '@internal/utils';

import {
	isAnalyticsResponseUserTrendPointArray,
	isDifficultyStatsRecord,
	isTopicAnalyticsRecordArray,
} from '../../../internal/utils/entityGuards';
import { AnalyticsCommonService } from './common-analytics.service';

type DifficultyStatRow = DifficultyStatsRecord & { totalQuestions?: number; scoreSum?: number };

@Injectable()
export class GlobalAnalyticsService {
	constructor(
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepo: Repository<GameHistoryEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepo: Repository<UserEntity>,
		private readonly cacheService: CacheService,
		private readonly analyticsCommon: AnalyticsCommonService
	) {}

	async getTopicStats(query: GameAnalyticsQuery): Promise<AnalyticsResponse<TopicStatsData>> {
		try {
			logger.analyticsStats('topic', {});

			const topics = await this.getTopicsFromDatabase(query);

			return this.analyticsCommon.createAnalyticsResponse({
				topics: topics,
				totalTopics: topics.length,
			});
		} catch (error) {
			logger.analyticsError('getTopicStats', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getGlobalDifficultyStats(): Promise<DifficultyBreakdown> {
		try {
			logger.analyticsStats('global_difficulty', {});

			const cacheKey = SERVER_CACHE_KEYS.ANALYTICS.GLOBAL_DIFFICULTY;

			return await this.cacheService.getOrSet<DifficultyBreakdown>(
				cacheKey,
				async () => {
					const queryBuilder = this.gameHistoryRepo.createQueryBuilder('game');

					const difficultyStats = await queryBuilder
						.select('game.difficulty', 'difficulty')
						.addSelect('CAST(COUNT(*) AS INTEGER)', 'total')
						.addSelect('CAST(COALESCE(SUM(game.correct_answers), 0) AS INTEGER)', 'correct')
						.addSelect('CAST(COALESCE(SUM(game.game_question_count), 0) AS INTEGER)', 'totalQuestions')
						.addSelect('CAST(COALESCE(SUM(game.score), 0) AS INTEGER)', 'scoreSum')
						.where(`game.difficulty ${SQL_CONDITIONS.IS_NOT_NULL}`)
						.andWhere("game.difficulty != ''")
						.groupBy('game.difficulty')
						.getRawMany<DifficultyStatRow>();

					const result: DifficultyBreakdown = {};
					difficultyStats.forEach(stat => {
						if (stat?.difficulty && isGameDifficulty(stat.difficulty) && stat.total != null && stat.correct != null) {
							const totalQuestions = stat.totalQuestions ?? 0;
							const scoreSum = stat.scoreSum ?? 0;
							result[stat.difficulty] = {
								total: stat.total,
								correct: stat.correct,
								successRate: totalQuestions > 0 ? calculateScoreRate(scoreSum, totalQuestions) : undefined,
							};
						}
					});

					return result;
				},
				TIME_DURATIONS_SECONDS.THIRTY_MINUTES,
				isDifficultyStatsRecord
			);
		} catch (error) {
			logger.analyticsError('getGlobalDifficultyStats', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getGlobalStats(): Promise<GlobalStatsResponse> {
		try {
			const cacheKey = SERVER_CACHE_KEYS.ANALYTICS.GLOBAL_STATS;

			return await this.cacheService.getOrSet<GlobalStatsResponse>(
				cacheKey,
				async () => {
					const gameStats = await this.calculateGameStats();

					const totalUsersRaw = await this.userRepo
						.createQueryBuilder('user')
						.select('CAST(COUNT(*) AS INTEGER)', 'value')
						.getRawOne<NumericQueryResult>();

					const totalUsers = totalUsersRaw?.value ?? 1;
					const averageGames = totalUsers > 0 ? Math.round(gameStats.totalGames / totalUsers) : 0;

					const averageGameTimeRaw = gameStats.timeStats.averageTime;
					const averageGameTime = averageGameTimeRaw
						? Math.round(averageGameTimeRaw / TIME_DURATIONS_SECONDS.MINUTE)
						: 0;

					const consistencyRaw = await this.gameHistoryRepo
						.createQueryBuilder('game')
						.select('game.user_id', 'userId')
						.addSelect(
							'CAST(SUM(game.correct_answers) AS DOUBLE PRECISION) / NULLIF(CAST(SUM(game.game_question_count) AS DOUBLE PRECISION), 0) * 100',
							'successRate'
						)
						.groupBy('game.user_id')
						.having('SUM(game.game_question_count) > 0')
						.getRawMany<UserIdSuccessRateRecord>();

					let consistency = 0;
					if (consistencyRaw.length > 0) {
						const successRates = consistencyRaw.map(r => (VALIDATORS.number(r.successRate) ? r.successRate : 0));
						const stats = computeMeanVarianceStddev(successRates);
						consistency = Math.max(0, Math.round(100 - stats.standardDeviation * 2));
					}

					return {
						successRate: gameStats.successRate,
						averageGames,
						averageGameTime,
						consistency,
					};
				},
				TIME_DURATIONS_SECONDS.THIRTY_MINUTES,
				(data): data is GlobalStatsResponse => {
					return (
						isRecord(data) &&
						hasProperty(data, 'successRate') &&
						VALIDATORS.number(data.successRate) &&
						hasProperty(data, 'averageGames') &&
						VALIDATORS.number(data.averageGames) &&
						hasProperty(data, 'averageGameTime') &&
						VALIDATORS.number(data.averageGameTime) &&
						hasProperty(data, 'consistency') &&
						VALIDATORS.number(data.consistency)
					);
				}
			);
		} catch (error) {
			logger.analyticsError('getGlobalStats', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getGlobalTrends(query?: TrendQueryOptions): Promise<AnalyticsResponse<UserTrendPoint[]>> {
		try {
			const cacheKey = SERVER_CACHE_KEYS.ANALYTICS.GLOBAL_TRENDS(query);
			return await this.cacheService.getOrSet<AnalyticsResponse<UserTrendPoint[]>>(
				cacheKey,
				async () => {
					const limit = clamp(
						Math.floor(query?.limit && query.limit > 0 ? query.limit : VALIDATION_COUNT.ACTIVITY_ENTRIES.DEFAULT),
						VALIDATION_COUNT.ACTIVITY_ENTRIES.MIN,
						120
					);
					const { groupBy } = query ?? {};
					const queryBuilder = this.gameHistoryRepo.createQueryBuilder('game').orderBy('game.createdAt', 'DESC');
					if (query?.startDate ?? query?.endDate) {
						addDateRangeConditions(queryBuilder, 'game', 'createdAt', query.startDate, query.endDate);
					}
					const allGames = await queryBuilder.limit(limit * 10).getMany();
					const trends = this.analyticsCommon.buildTrends(allGames, { limit, groupBy });
					return this.analyticsCommon.createAnalyticsResponse(trends);
				},
				TIME_DURATIONS_SECONDS.FIVE_MINUTES,
				isAnalyticsResponseUserTrendPointArray
			);
		} catch (error) {
			logger.analyticsError('getGlobalTrends', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getGameStatsForComparison(): Promise<GameStatsSummary> {
		const stats = await this.calculateGameStats();
		return {
			successRate: stats.successRate,
			averageScore: stats.averageScore,
			totalGames: stats.totalGames,
		};
	}

	private async getTopicsFromDatabase(query?: GameAnalyticsQuery): Promise<TopicAnalyticsRecord[]> {
		try {
			const cacheKey = SERVER_CACHE_KEYS.ANALYTICS.TOPICS_STATS(query);

			return await this.cacheService.getOrSet<TopicAnalyticsRecord[]>(
				cacheKey,
				async () => {
					const queryBuilder = this.createFilteredGameHistoryQuery(query).andWhere(
						'game.gameQuestionCount > :minQuestions',
						{ minQuestions: 0 }
					);

					const topicStatsRaw = await queryBuilder
						.select('game.topic', 'topic')
						.addSelect('CAST(COUNT(*) AS INTEGER)', 'totalGames')
						.groupBy('game.topic')
						.addOrderBy('COUNT(*)', 'DESC')
						.getRawMany<TopicAnalyticsRecord>();

					const filtered = topicStatsRaw.filter(
						(stat): stat is TopicAnalyticsRecord => stat.topic != null && stat.totalGames != null
					);
					return this.normalizeTopicStats(filtered);
				},
				TIME_DURATIONS_SECONDS.THIRTY_MINUTES,
				isTopicAnalyticsRecordArray
			);
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), {
				contextMessage: 'Failed to get topics from database',
			});
			return [];
		}
	}

	private normalizeTopicStats(stats: TopicAnalyticsRecord[]): TopicAnalyticsRecord[] {
		const topicsMap = new Map<string, { original: string; count: number; maxVariantCount: number }>();
		for (const stat of stats) {
			const trimmed = stat.topic.trim();
			const lowerKey = trimmed.toLowerCase();
			const count = stat.totalGames ?? 0;
			const existing = topicsMap.get(lowerKey);
			if (existing) {
				existing.count += count;
				if (count > existing.maxVariantCount) {
					existing.original = trimmed;
					existing.maxVariantCount = count;
				}
			} else {
				topicsMap.set(lowerKey, { original: trimmed, count, maxVariantCount: count });
			}
		}
		return Array.from(topicsMap.values())
			.map(({ original, count }) => ({ topic: original, totalGames: count }))
			.sort((a, b) => b.totalGames - a.totalGames);
	}

	private createFilteredGameHistoryQuery(query?: GameAnalyticsQuery): SelectQueryBuilder<GameHistoryEntity> {
		const queryBuilder = this.gameHistoryRepo.createQueryBuilder('game');

		if (!query) {
			return queryBuilder;
		}

		if (query.startDate ?? query.endDate) {
			addDateRangeConditions(queryBuilder, 'game', 'createdAt', query.startDate, query.endDate);
		}

		if (query.topic) {
			queryBuilder.andWhere('game.topic = :topic', { topic: query.topic });
		}

		if (query.difficulty) {
			queryBuilder.andWhere('game.difficulty = :difficulty', {
				difficulty: query.difficulty,
			});
		}

		return queryBuilder;
	}

	private async calculateGameStats(query?: GameAnalyticsQuery): Promise<GameStatsData> {
		try {
			const totalGames = await this.createFilteredGameHistoryQuery(query).getCount();

			const totalQuestionsAskedRaw = await this.createFilteredGameHistoryQuery(query)
				.select('CAST(COALESCE(SUM(game.game_question_count), 0) AS INTEGER)', 'value')
				.getRawOne<NumericQueryResult>();

			const totalScoreRaw = await this.createFilteredGameHistoryQuery(query)
				.select('CAST(COALESCE(SUM(game.score), 0) AS INTEGER)', 'value')
				.getRawOne<NumericQueryResult>();

			const topicStatsRaw = await this.createFilteredGameHistoryQuery(query)
				.andWhere('game.gameQuestionCount > :minQuestions', { minQuestions: 0 })
				.select('game.topic', 'topic')
				.addSelect('CAST(COUNT(*) AS INTEGER)', 'totalGames')
				.groupBy('game.topic')
				.addOrderBy('COUNT(*)', 'DESC')
				.limit(5)
				.getRawMany<TopicAnalyticsRecord>();

			const difficultyStatsRaw = await this.createFilteredGameHistoryQuery(query)
				.select('game.difficulty', 'difficulty')
				.addSelect('CAST(COUNT(*) AS INTEGER)', 'total')
				.addSelect('CAST(COALESCE(SUM(game.correct_answers), 0) AS INTEGER)', 'correct')
				.groupBy('game.difficulty')
				.getRawMany<DifficultyStatsRaw>();

			const averageTimeRaw = await this.createFilteredGameHistoryQuery(query)
				.select('CAST(AVG(game.timeSpent) AS DOUBLE PRECISION)', 'value')
				.getRawOne<NumericQueryResult>();

			let medianTime: number | null = null;
			try {
				const medianQueryBuilder = this.createFilteredGameHistoryQuery(query).select('game.timeSpent', 'timeSpent');

				const sql = medianQueryBuilder.getQuery();
				const params = medianQueryBuilder.getParameters();
				const paramKeys = Object.keys(params);
				const paramValues = Object.values(params);

				let whereClause = '';
				if (sql.includes('WHERE')) {
					const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s*$)/is);
					if (whereMatch?.[1] != null) {
						let processedWhere = whereMatch[1].trim();
						paramKeys.forEach((key, index) => {
							processedWhere = processedWhere.replace(new RegExp(`:${key}\\b`, 'g'), `$${index + 1}`);
						});
						whereClause = ` WHERE ${processedWhere}`;
					}
				}

				const medianQuery = `SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "time_spent") AS "medianTime" FROM "game_history"${whereClause}`;
				const medianResult = await this.gameHistoryRepo.query(medianQuery, paramValues);
				const firstResult = medianResult?.[0];
				medianTime = firstResult?.medianTime ?? null;
			} catch (error) {
				logger.analyticsError('calculateGameStats median calculation', {
					errorInfo: { message: getErrorMessage(error) },
				});
			}

			const timeStatsRaw = {
				averageTime: averageTimeRaw?.value ?? null,
				medianTime,
			};

			const questionsAsked = totalQuestionsAskedRaw?.value ?? 0;
			const totalScore = totalScoreRaw?.value ?? 0;
			const successRate = questionsAsked > 0 ? calculateScoreRate(totalScore, questionsAsked) : 0;
			const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;

			const topicStatsFiltered = topicStatsRaw.filter(
				(stat): stat is TopicAnalyticsRecord => stat.topic != null && stat.totalGames != null
			);
			const normalizedTopics = this.normalizeTopicStats(topicStatsFiltered);
			const popularTopics = normalizedTopics.slice(0, 5).map(t => t.topic);

			const difficultyDistribution: CountRecord = buildCountRecord(
				difficultyStatsRaw,
				stat => stat?.difficulty ?? null,
				stat => stat?.total ?? 0
			);

			return {
				totalGames,
				totalQuestionsAnswered: questionsAsked,
				successRate,
				averageScore,
				popularTopics,
				difficultyDistribution,
				timeStats: {
					averageTime: timeStatsRaw?.averageTime ?? null,
					medianTime: timeStatsRaw?.medianTime ?? null,
				},
			};
		} catch (error) {
			logger.analyticsError('calculateGameStats', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}
}
