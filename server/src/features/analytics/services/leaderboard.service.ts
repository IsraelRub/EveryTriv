import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LeaderboardPeriod, SERVER_CACHE_KEYS, TIME_DURATIONS_SECONDS, TIME_PERIODS_MS } from '@shared/constants';
import type { LeaderboardStats } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

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
		const { limit = 100, offset = 0 } = params;
		try {
			const cacheKey = SERVER_CACHE_KEYS.LEADERBOARD.GLOBAL(limit, offset);

			return await this.cacheService.getOrSet<UserStatsEntity[]>(
				cacheKey,
				async () => {
					try {
						const leaderboard = await this.userStatsRepository.find({
							relations: ['user'],
							order: { weeklyScore: 'DESC' },
							take: limit,
							skip: offset,
						});

						return leaderboard;
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
		const { period, limit = 100 } = params;
		try {
			const cacheKey = SERVER_CACHE_KEYS.LEADERBOARD.PERIOD(period, limit);

			return await this.cacheService.getOrSet<UserStatsEntity[]>(
				cacheKey,
				async () => {
					try {
						// Type-safe mapping for period to score field
						const scoreFieldMap: Record<LeaderboardPeriod, keyof UserStatsEntity> = {
							[LeaderboardPeriod.WEEKLY]: 'weeklyScore',
							[LeaderboardPeriod.MONTHLY]: 'monthlyScore',
							[LeaderboardPeriod.YEARLY]: 'yearlyScore',
							[LeaderboardPeriod.GLOBAL]: 'weeklyScore', // fallback
						};

						const scoreField = scoreFieldMap[period];
						if (!scoreField) {
							throw new Error(`Invalid period: ${period}. Valid periods are: weekly, monthly, yearly`);
						}

						const leaderboard = await this.userStatsRepository
							.createQueryBuilder('userStats')
							.leftJoinAndSelect('userStats.user', 'user')
							.orderBy(`userStats.${scoreField}`, 'DESC')
							.limit(limit)
							.getMany();

						return leaderboard;
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
					// Calculate date range based on period
					const now = new Date();
					let startDate: Date;

					switch (period) {
						case LeaderboardPeriod.WEEKLY:
							startDate = new Date(now.getTime() - TIME_PERIODS_MS.WEEK);
							break;
						case LeaderboardPeriod.MONTHLY:
							startDate = new Date(now.getTime() - TIME_PERIODS_MS.MONTH);
							break;
						case LeaderboardPeriod.YEARLY:
							startDate = new Date(now.getTime() - TIME_PERIODS_MS.YEAR);
							break;
						default:
							startDate = new Date(now.getTime() - TIME_PERIODS_MS.WEEK);
					}

					// Get active users (users who played games in the period)
					const activeUsersQueryBuilder = this.gameHistoryRepository
						.createQueryBuilder('game')
						.select('CAST(COUNT(DISTINCT game.userId) AS INTEGER)', 'value');
					addDateRangeConditions(activeUsersQueryBuilder, 'game', 'createdAt', startDate);
					const activeUsersRaw = await activeUsersQueryBuilder.getRawOne<NumericQueryResult>();

					const activeUsers = activeUsersRaw?.value ?? 0;

					// Get average scoring from leaderboard entries for the period
					const scoreFieldMap: Record<LeaderboardPeriod, keyof UserStatsEntity> = {
						[LeaderboardPeriod.WEEKLY]: 'weeklyScore',
						[LeaderboardPeriod.MONTHLY]: 'monthlyScore',
						[LeaderboardPeriod.YEARLY]: 'yearlyScore',
						[LeaderboardPeriod.GLOBAL]: 'weeklyScore', // fallback
					};

					const scoreField = scoreFieldMap[period];
					if (!scoreField) {
						throw new Error(`Invalid period: ${period}`);
					}

					const averageScoreRaw = await this.userStatsRepository
						.createQueryBuilder('userStats')
						.select(`CAST(AVG(userStats.${scoreField}) AS DOUBLE PRECISION)`, 'average')
						.where(`userStats.${scoreField} > 0`)
						.getRawOne<AverageRecord>();

					const averageScore = averageScoreRaw?.average ? Math.round(averageScoreRaw.average) : 0;

					// Get average games played in the period
					const averageGamesQueryBuilder = this.gameHistoryRepository
						.createQueryBuilder('game')
						.select('CAST(COUNT(*) AS DOUBLE PRECISION)', 'total')
						.addSelect('CAST(COUNT(DISTINCT game.userId) AS DOUBLE PRECISION)', 'users');
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
}
