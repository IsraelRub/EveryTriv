import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';

import { TIME_PERIODS_MS } from '@shared/constants';
import { ensureErrorObject, getErrorMessage } from '@shared/utils';

import { UserStatsEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';

import { UserStatsUpdateService } from '../../analytics/services/user-stats-update.service';
import { UserStatsMaintenanceService } from '../user-stats-maintenance.service';

@Injectable()
export class ScoreResetScheduler {
	constructor(
		@InjectRepository(UserStatsEntity)
		private readonly userStatsRepository: Repository<UserStatsEntity>,
		private readonly userStatsUpdateService: UserStatsUpdateService,
		private readonly userStatsMaintenanceService: UserStatsMaintenanceService
	) {}

	@Cron(CronExpression.EVERY_WEEK)
	async resetWeeklyScores() {
		try {
			logger.systemInfo('Starting weekly score reset', {});

			const oneWeekAgo = new Date(Date.now() - TIME_PERIODS_MS.WEEK);
			const usersToReset = await this.userStatsRepository.find({
				where: [{ lastWeeklyReset: IsNull() }, { lastWeeklyReset: LessThan(oneWeekAgo) }],
			});

			let resetCount = 0;
			for (const userStats of usersToReset) {
				userStats.weeklyScore = 0;
				userStats.lastWeeklyReset = new Date();
				await this.userStatsRepository.save(userStats);
				resetCount++;
			}

			logger.systemInfo('Weekly score reset completed', {
				usersReset: resetCount,
			});
		} catch (error) {
			logger.systemError(ensureErrorObject(error), {
				contextMessage: 'Weekly score reset failed',
			});
		}
	}

	@Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
	async resetMonthlyScores() {
		try {
			logger.systemInfo('Starting monthly score reset', {});

			const oneMonthAgo = new Date(Date.now() - TIME_PERIODS_MS.MONTH);
			const usersToReset = await this.userStatsRepository.find({
				where: [{ lastMonthlyReset: IsNull() }, { lastMonthlyReset: LessThan(oneMonthAgo) }],
			});

			let resetCount = 0;
			for (const userStats of usersToReset) {
				userStats.monthlyScore = 0;
				userStats.lastMonthlyReset = new Date();
				await this.userStatsRepository.save(userStats);
				resetCount++;
			}

			logger.systemInfo('Monthly score reset completed', {
				usersReset: resetCount,
			});
		} catch (error) {
			logger.systemError(ensureErrorObject(error), {
				contextMessage: 'Monthly score reset failed',
			});
		}
	}

	@Cron('0 0 1 1 *')
	async resetYearlyScores() {
		try {
			logger.systemInfo('Starting yearly score reset', {});

			const oneYearAgo = new Date(Date.now() - TIME_PERIODS_MS.YEAR);
			const usersToReset = await this.userStatsRepository.find({
				where: [{ lastYearlyReset: IsNull() }, { lastYearlyReset: LessThan(oneYearAgo) }],
			});

			let resetCount = 0;
			for (const userStats of usersToReset) {
				userStats.yearlyScore = 0;
				userStats.lastYearlyReset = new Date();
				await this.userStatsRepository.save(userStats);
				resetCount++;
			}

			logger.systemInfo('Yearly score reset completed', {
				usersReset: resetCount,
			});
		} catch (error) {
			logger.systemError(ensureErrorObject(error), {
				contextMessage: 'Yearly score reset failed',
			});
		}
	}

	// ==================== Stats Synchronization Jobs ====================

	@Cron('0 */6 * * *') // Every 6 hours
	async retryFailedStatsUpdates() {
		try {
			logger.systemInfo('Starting retry of failed stats updates', {});

			await this.userStatsUpdateService.retryFailedUpdates();

			logger.systemInfo('Retry of failed stats updates completed', {});
		} catch (error) {
			logger.systemError(ensureErrorObject(error), {
				contextMessage: 'Retry of failed stats updates failed',
			});
		}
	}

	@Cron(CronExpression.EVERY_DAY_AT_2AM) // Daily at 2 AM
	async checkAllUsersConsistency() {
		try {
			logger.systemInfo('Starting daily consistency check for all users', {});

			const result = await this.userStatsMaintenanceService.checkAllUsersConsistency();

			logger.systemInfo('Daily consistency check completed', {
				totalUsers: result.totalUsers,
				usersWithGames: result.usersWithGames,
				consistentUsers: result.consistentUsers,
				inconsistentUsers: result.inconsistentUsers,
			});

			// Auto-fix inconsistencies if there are any
			if (result.inconsistentUsers > 0) {
				logger.systemInfo('Auto-fixing inconsistent users', {
					count: result.inconsistentUsers,
				});

				let fixedCount = 0;
				for (const userResult of result.results) {
					if (!userResult.isConsistent) {
						try {
							await this.userStatsMaintenanceService.fixConsistency(userResult.userId);
							fixedCount++;
						} catch (error) {
							logger.analyticsError('Failed to auto-fix user consistency', {
								errorInfo: { message: getErrorMessage(error) },
								userId: userResult.userId,
							});
						}
					}
				}

				logger.systemInfo('Auto-fix completed', {
					attempt: result.inconsistentUsers,
					fixedCount: fixedCount,
				});
			}
		} catch (error) {
			logger.systemError(ensureErrorObject(error), {
				contextMessage: 'Daily consistency check failed',
			});
		}
	}
}
