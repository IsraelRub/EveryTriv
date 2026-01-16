import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThanOrEqual, Repository } from 'typeorm';

import { SERVER_CACHE_KEYS, TIME_DURATIONS_SECONDS, TIME_PERIODS_MS } from '@shared/constants';
import type { BusinessMetrics } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { isBusinessMetricsData } from '@shared/utils/domain';

import { GameHistoryEntity, PaymentHistoryEntity, UserEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { NumericQueryResult } from '@internal/types';
import { addDateRangeConditions } from '@internal/utils';

@Injectable()
export class BusinessAnalyticsService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepo: Repository<UserEntity>,
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepo: Repository<GameHistoryEntity>,
		@InjectRepository(PaymentHistoryEntity)
		private readonly paymentRepository: Repository<PaymentHistoryEntity>,
		private readonly cacheService: CacheService
	) {}

	async getBusinessMetrics(): Promise<BusinessMetrics> {
		try {
			const businessMetrics = await this.calculateBusinessMetrics();
			return businessMetrics;
		} catch (error) {
			logger.analyticsError('getBusinessMetrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	private async calculateBusinessMetrics(): Promise<BusinessMetrics> {
		try {
			const cacheKey = SERVER_CACHE_KEYS.ANALYTICS.BUSINESS_METRICS;

			return await this.cacheService.getOrSet<BusinessMetrics>(
				cacheKey,
				async () => {
					const totalUsers = await this.userRepo.count();
					const activeUsers = await this.userRepo.count({
						where: { isActive: true },
					});

					const thirtyDaysAgo = new Date();
					thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

					const newUsersThisMonth = await this.userRepo.count({
						where: {
							createdAt: MoreThanOrEqual(thirtyDaysAgo),
						},
					});

					const totalRevenueRaw = await this.paymentRepository
						.createQueryBuilder('payment')
						.select('CAST(SUM(payment.amount) AS DOUBLE PRECISION)', 'value')
						.where('payment.status = :status', { status: 'completed' })
						.getRawOne<NumericQueryResult>();

					const monthlyRevenueQueryBuilder = this.paymentRepository
						.createQueryBuilder('payment')
						.select('CAST(SUM(payment.amount) AS DOUBLE PRECISION)', 'value')
						.where('payment.status = :status', { status: 'completed' });
					addDateRangeConditions(monthlyRevenueQueryBuilder, 'payment', 'createdAt', thirtyDaysAgo);
					const monthlyRevenueRaw = await monthlyRevenueQueryBuilder.getRawOne<NumericQueryResult>();

					const dailyActiveUsersQueryBuilder = this.gameHistoryRepo
						.createQueryBuilder('game')
						.select('CAST(COUNT(DISTINCT game.userId) AS INTEGER)', 'value');
					addDateRangeConditions(
						dailyActiveUsersQueryBuilder,
						'game',
						'createdAt',
						new Date(Date.now() - TIME_PERIODS_MS.DAY)
					);
					const dailyActiveUsersRaw = await dailyActiveUsersQueryBuilder.getRawOne<NumericQueryResult>();

					const weeklyActiveUsersQueryBuilder = this.gameHistoryRepo
						.createQueryBuilder('game')
						.select('CAST(COUNT(DISTINCT game.userId) AS INTEGER)', 'value');
					addDateRangeConditions(
						weeklyActiveUsersQueryBuilder,
						'game',
						'createdAt',
						new Date(Date.now() - TIME_PERIODS_MS.WEEK)
					);
					const weeklyActiveUsersRaw = await weeklyActiveUsersQueryBuilder.getRawOne<NumericQueryResult>();

					const totalRevenueValue = totalRevenueRaw?.value ?? 0;
					const monthlyRevenueValue = monthlyRevenueRaw?.value ?? 0;
					const dailyActiveUsersValue = dailyActiveUsersRaw?.value ?? 0;
					const weeklyActiveUsersValue = weeklyActiveUsersRaw?.value ?? 0;

					const lastMonthUsers = await this.userRepo.count({
						where: {
							createdAt: LessThan(thirtyDaysAgo),
						},
					});

					const churnedUsers = await this.userRepo.count({
						where: {
							createdAt: LessThan(new Date(Date.now() - TIME_PERIODS_MS.MONTH * 2)),
							isActive: false,
						},
					});

					const churnRate = lastMonthUsers > 0 ? churnedUsers / lastMonthUsers : 0;

					return {
						revenue: {
							total: totalRevenueValue,
							mrr: monthlyRevenueValue,
							arpu: totalUsers > 0 ? totalRevenueValue / totalUsers : 0,
						},
						users: {
							total: totalUsers,
							active: activeUsers,
							newThisMonth: newUsersThisMonth,
							churnRate: churnRate,
						},
						engagement: {
							dau: dailyActiveUsersValue,
							wau: weeklyActiveUsersValue,
							mau: activeUsers,
							avgSessionDuration: TIME_DURATIONS_SECONDS.THIRTY_MINUTES,
						},
					};
				},
				TIME_DURATIONS_SECONDS.THIRTY_MINUTES,
				isBusinessMetricsData
			);
		} catch (error) {
			logger.analyticsError('calculateBusinessMetrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}
}
