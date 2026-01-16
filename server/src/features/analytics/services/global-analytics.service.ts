import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { SERVER_CACHE_KEYS, TIME_DURATIONS_SECONDS, VALIDATORS } from '@shared/constants';
import type {
	AnalyticsResponse,
	CountRecord,
	DifficultyBreakdown,
	DifficultyStatsRaw,
	GameAnalyticsQuery,
	GlobalStatsResponse,
	TopicAnalyticsRecord,
	TopicStatsData,
	TrendQueryOptions,
	UserTrendPoint,
} from '@shared/types';
import {
	buildCountRecord,
	calculateSuccessRate,
	ensureErrorObject,
	getErrorMessage,
	hasProperty,
	isDifficultyStatsRecord,
	isRecord,
	isTopicAnalyticsRecordArray,
} from '@shared/utils';
import { isGameDifficulty } from '@shared/validation';

import { SQL_CONDITIONS } from '@internal/constants';
import { GameHistoryEntity, UserEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { DifficultyStatsRecord, NumericQueryResult, UserIdSuccessRateRecord } from '@internal/types';
import { addDateRangeConditions } from '@internal/utils';

import { AnalyticsCommonService } from './common-analytics.service';

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
						.addSelect('CAST(COALESCE(SUM(game.correctAnswers), 0) AS INTEGER)', 'correct')
						.where(`game.difficulty ${SQL_CONDITIONS.IS_NOT_NULL}`)
						.andWhere("game.difficulty != ''")
						.groupBy('game.difficulty')
						.getRawMany<DifficultyStatsRecord>();

					const result: DifficultyBreakdown = {};
					difficultyStats.forEach(stat => {
						if (stat?.difficulty && isGameDifficulty(stat.difficulty) && stat.total != null && stat.correct != null) {
							const total = stat.total;
							const correct = stat.correct;
							result[stat.difficulty] = {
								total,
								correct,
								successRate: total > 0 ? calculateSuccessRate(total, correct) : undefined,
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
					const averageGameTime = averageGameTimeRaw ? Math.round(averageGameTimeRaw / 60) : 0;

					const consistencyRaw = await this.gameHistoryRepo
						.createQueryBuilder('game')
						.select('game.userId', 'userId')
						.addSelect(
							'CAST(SUM(game.correctAnswers) AS DOUBLE PRECISION) / NULLIF(CAST(SUM(game.game_question_count) AS DOUBLE PRECISION), 0) * 100',
							'successRate'
						)
						.groupBy('game.userId')
						.having('SUM(game.game_question_count) > 0')
						.getRawMany<UserIdSuccessRateRecord>();

					let consistency = 0;
					if (consistencyRaw.length > 0) {
						const successRates = consistencyRaw.map(r => Number(r.successRate) ?? 0);
						const mean = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
						const variance =
							successRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / successRates.length;
						const standardDeviation = Math.sqrt(variance);
						consistency = Math.max(0, Math.round(100 - standardDeviation * 2));
					}

					return {
						successRate: Math.round(gameStats.averageScore),
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
			const limit = query?.limit && query.limit > 0 ? Math.min(Math.floor(query.limit), 120) : 30;
			const { groupBy } = query ?? {};

			const queryBuilder = this.gameHistoryRepo.createQueryBuilder('game').orderBy('game.createdAt', 'DESC');

			if (query?.startDate ?? query?.endDate) {
				addDateRangeConditions(queryBuilder, 'game', 'createdAt', query.startDate, query.endDate);
			}

			const allGames = await queryBuilder.limit(limit * 10).getMany();

			const trends = this.analyticsCommon.buildTrends(allGames, {
				limit,
				groupBy,
			});
			return this.analyticsCommon.createAnalyticsResponse(trends);
		} catch (error) {
			logger.analyticsError('getGlobalTrends', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getGameStatsForComparison(): Promise<{
		averageScore: number;
		totalGames: number;
	}> {
		const stats = await this.calculateGameStats();
		return {
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
					const queryBuilder = this.createFilteredGameHistoryQuery(query);

					const topicStatsRaw = await queryBuilder
						.select('game.topic', 'topic')
						.addSelect('CAST(COUNT(*) AS INTEGER)', 'totalGames')
						.groupBy('game.topic')
						.addOrderBy('COUNT(*)', 'DESC')
						.getRawMany<TopicAnalyticsRecord>();

					return topicStatsRaw.filter(
						(stat): stat is TopicAnalyticsRecord => stat.topic != null && stat.totalGames != null
					);
				},
				TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES,
				isTopicAnalyticsRecordArray
			);
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), {
				contextMessage: 'Failed to get topics from database',
			});
			return [];
		}
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

	private async calculateGameStats(query?: GameAnalyticsQuery): Promise<{
		totalGames: number;
		totalQuestionsAnswered: number;
		averageScore: number;
		popularTopics: string[];
		difficultyDistribution: CountRecord;
		timeStats: {
			averageTime: number | null;
			medianTime: number | null;
		};
	}> {
		try {
			const totalGames = await this.createFilteredGameHistoryQuery(query).getCount();

			const totalCorrectAnswersRaw = await this.createFilteredGameHistoryQuery(query)
				.select('CAST(COALESCE(SUM(game.correctAnswers), 0) AS INTEGER)', 'value')
				.getRawOne<NumericQueryResult>();

			const totalQuestionsAskedRaw = await this.createFilteredGameHistoryQuery(query)
				.select('CAST(COALESCE(SUM(game.game_question_count), 0) AS INTEGER)', 'value')
				.getRawOne<NumericQueryResult>();

			const topicStatsRaw = await this.createFilteredGameHistoryQuery(query)
				.select('game.topic', 'topic')
				.addSelect('CAST(COUNT(*) AS INTEGER)', 'totalGames')
				.groupBy('game.topic')
				.addOrderBy('COUNT(*)', 'DESC')
				.limit(5)
				.getRawMany<TopicAnalyticsRecord>();

			const difficultyStatsRaw = await this.createFilteredGameHistoryQuery(query)
				.select('game.difficulty', 'difficulty')
				.addSelect('CAST(COUNT(*) AS INTEGER)', 'total')
				.addSelect('CAST(COALESCE(SUM(game.correctAnswers), 0) AS INTEGER)', 'correct')
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

			const correctAnswers = totalCorrectAnswersRaw?.value ?? 0;
			const questionsAsked = totalQuestionsAskedRaw?.value ?? 0;
			const averageScore = calculateSuccessRate(questionsAsked, correctAnswers);

			const popularTopics = topicStatsRaw.reduce<string[]>((acc, stat) => {
				const topic = stat?.topic ?? '';
				if (topic !== '') {
					acc.push(topic);
				}
				return acc;
			}, []);

			const difficultyDistribution: CountRecord = buildCountRecord(
				difficultyStatsRaw,
				stat => stat?.difficulty ?? null,
				stat => stat?.total ?? 0
			);

			return {
				totalGames,
				totalQuestionsAnswered: questionsAsked,
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
