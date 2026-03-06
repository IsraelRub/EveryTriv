import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	ERROR_MESSAGES,
	LeaderboardPeriod,
	SERVER_CACHE_KEYS,
	TIME_DURATIONS_SECONDS,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { LeaderboardStats } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { LEADERBOARD_PERIOD_CONFIG } from '@internal/constants';
import { GameHistoryEntity, UserStatsEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type {
	AverageRecord,
	GlobalLeaderboardParams,
	LeaderboardPeriodParams,
	NumericQueryResult,
	TotalUsersRecord,
} from '@internal/types';
import { addDateRangeConditions, isLeaderboardStats } from '@internal/utils';

@Injectable()
export class LeaderboardAnalyticsService {
	constructor(
		@InjectRepository(UserStatsEntity)
		private readonly userStatsRepository: Repository<UserStatsEntity>,
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
		private readonly cacheService: CacheService
	) {}

	async getGlobalLeaderboard(params: GlobalLeaderboardParams = {}): Promise<UserStatsEntity[]> {
		const { limit = VALIDATION_COUNT.LEADERBOARD.MAX, offset = 0 } = params;
		try {
			const cacheKey = SERVER_CACHE_KEYS.LEADERBOARD.GLOBAL(limit, offset);

			return await this.cacheService.getOrSet<UserStatsEntity[]>(
				cacheKey,
				async () => {
					try {
						const scoreField = LEADERBOARD_PERIOD_CONFIG[LeaderboardPeriod.GLOBAL].scoreField;
						const fetchSize = Math.min(limit + offset + 500, 1500);
						const raw = await this.userStatsRepository
							.createQueryBuilder('userStats')
							.innerJoinAndSelect('userStats.user', 'user')
							.where('user.isActive = :isActive', { isActive: true })
							.orderBy(`userStats.${scoreField}`, 'DESC')
							.addOrderBy('userStats.totalGames', 'DESC')
							.addOrderBy('userStats.userId', 'ASC')
							.take(fetchSize)
							.getMany();

						const byUser = LeaderboardAnalyticsService.deduplicateByUserId(raw);
						return byUser.slice(offset, offset + limit);
					} catch (dbError) {
						logger.analyticsError('Database error in getGlobalLeaderboard', {
							errorInfo: { message: getErrorMessage(dbError) },
							limit,
							offset,
						});
						throw dbError;
					}
				},
				TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES,
				(data): data is UserStatsEntity[] => Array.isArray(data)
			);
		} catch (error) {
			logger.analyticsError('getGlobalLeaderboard', {
				errorInfo: { message: getErrorMessage(error) },
				limit,
				offset,
			});
			throw error;
		}
	}

	async getLeaderboardByPeriod(params: LeaderboardPeriodParams): Promise<UserStatsEntity[]> {
		const { period, limit = VALIDATION_COUNT.LEADERBOARD.MAX } = params;
		try {
			const cacheKey = SERVER_CACHE_KEYS.LEADERBOARD.PERIOD(period, limit);

			return await this.cacheService.getOrSet<UserStatsEntity[]>(
				cacheKey,
				async () => {
					try {
						const scoreField = LEADERBOARD_PERIOD_CONFIG[period].scoreField;
						if (!scoreField) {
							throw new BadRequestException(ERROR_MESSAGES.validation.INVALID_PERIOD_VALID_LIST(period));
						}

						const fetchSize = Math.min(limit + 500, 1500);
						const raw = await this.userStatsRepository
							.createQueryBuilder('userStats')
							.innerJoinAndSelect('userStats.user', 'user')
							.where('user.isActive = :isActive', { isActive: true })
							.orderBy(`userStats.${scoreField}`, 'DESC')
							.addOrderBy('userStats.totalGames', 'DESC')
							.addOrderBy('userStats.userId', 'ASC')
							.take(fetchSize)
							.getMany();

						const byUser = LeaderboardAnalyticsService.deduplicateByUserId(raw);
						return byUser.slice(0, limit);
					} catch (dbError) {
						logger.analyticsError('Database error in getLeaderboardByPeriod', {
							errorInfo: { message: getErrorMessage(dbError) },
							period,
							limit,
						});
						throw dbError;
					}
				},
				TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES,
				(data): data is UserStatsEntity[] => Array.isArray(data)
			);
		} catch (error) {
			logger.analyticsError('getLeaderboardByPeriod', {
				errorInfo: { message: getErrorMessage(error) },
				period,
			});
			throw error;
		}
	}

	async getLeaderboardStats(period: LeaderboardPeriod): Promise<LeaderboardStats> {
		try {
			const cacheKey = SERVER_CACHE_KEYS.LEADERBOARD.STATS(period);

			return await this.cacheService.getOrSet<LeaderboardStats>(
				cacheKey,
				async () => {
					if (period === LeaderboardPeriod.GLOBAL) {
						return this.getLeaderboardStatsAllTime();
					}

					const durationMs = LEADERBOARD_PERIOD_CONFIG[period].durationMs ?? 0;
					const startDate = new Date(Date.now() - durationMs);

					const activeUsersQueryBuilder = this.gameHistoryRepository
						.createQueryBuilder('game')
						.select('CAST(COUNT(DISTINCT game.user_id) AS INTEGER)', 'value');
					addDateRangeConditions(activeUsersQueryBuilder, 'game', 'createdAt', startDate);
					const activeUsersRaw = await activeUsersQueryBuilder.getRawOne<NumericQueryResult>();
					const activeUsers = activeUsersRaw?.value ?? 0;

					const scoreField = LEADERBOARD_PERIOD_CONFIG[period].scoreField;
					if (!scoreField) {
						throw new BadRequestException(ERROR_MESSAGES.validation.INVALID_PERIOD(period));
					}

					const averageScoreRaw = await this.userStatsRepository
						.createQueryBuilder('userStats')
						.select(`CAST(AVG(userStats.${scoreField}) AS DOUBLE PRECISION)`, 'average')
						.where(`userStats.${scoreField} > 0`)
						.getRawOne<AverageRecord>();
					const averageScore = averageScoreRaw?.average ? Math.round(averageScoreRaw.average) : 0;

					const averageGamesQueryBuilder = this.gameHistoryRepository
						.createQueryBuilder('game')
						.select('CAST(COUNT(*) AS DOUBLE PRECISION)', 'total')
						.addSelect('CAST(COUNT(DISTINCT game.user_id) AS DOUBLE PRECISION)', 'users');
					addDateRangeConditions(averageGamesQueryBuilder, 'game', 'createdAt', startDate);
					const averageGamesRaw = await averageGamesQueryBuilder.getRawOne<TotalUsersRecord>();
					const totalGames = averageGamesRaw?.total ?? 0;
					const uniqueUsers = averageGamesRaw?.users ?? 0;
					const averageGames = uniqueUsers > 0 ? Math.round(totalGames / uniqueUsers) : 0;

					return {
						activeUsers,
						averageScore,
						averageGames,
					};
				},
				TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES,
				isLeaderboardStats
			);
		} catch (error) {
			logger.analyticsError('getLeaderboardStats', {
				errorInfo: { message: getErrorMessage(error) },
				period,
			});
			throw error;
		}
	}

	private async getLeaderboardStatsAllTime(): Promise<LeaderboardStats> {
		const activeUsersRaw = await this.gameHistoryRepository
			.createQueryBuilder('game')
			.select('CAST(COUNT(DISTINCT game.user_id) AS INTEGER)', 'value')
			.getRawOne<NumericQueryResult>();
		const activeUsers = activeUsersRaw?.value ?? 0;

		const averageScoreRaw = await this.userStatsRepository
			.createQueryBuilder('userStats')
			.select('CAST(AVG(userStats.overallSuccessRate) AS DOUBLE PRECISION)', 'average')
			.where('userStats.totalGames > 0')
			.getRawOne<AverageRecord>();
		const averageScore = averageScoreRaw?.average != null ? Math.round(averageScoreRaw.average) : 0;

		const averageGamesRaw = await this.gameHistoryRepository
			.createQueryBuilder('game')
			.select('CAST(COUNT(*) AS DOUBLE PRECISION)', 'total')
			.addSelect('CAST(COUNT(DISTINCT game.user_id) AS DOUBLE PRECISION)', 'users')
			.getRawOne<TotalUsersRecord>();
		const totalGames = averageGamesRaw?.total ?? 0;
		const uniqueUsers = averageGamesRaw?.users ?? 0;
		const averageGames = uniqueUsers > 0 ? Math.round(totalGames / uniqueUsers) : 0;

		return {
			activeUsers,
			averageScore,
			averageGames,
		};
	}

	private static deduplicateByUserId(rows: UserStatsEntity[]): UserStatsEntity[] {
		const seen = new Set<string>();
		return rows.filter(row => {
			if (seen.has(row.userId)) return false;
			seen.add(row.userId);
			return true;
		});
	}
}
