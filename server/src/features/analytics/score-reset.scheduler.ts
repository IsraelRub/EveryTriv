import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';

import { TIME_PERIODS_MS } from '@shared/constants';
import { ensureErrorObject } from '@shared/utils';

import { UserStatsEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';

@Injectable()
export class ScoreResetScheduler {
	constructor(
		@InjectRepository(UserStatsEntity)
		private readonly userStatsRepository: Repository<UserStatsEntity>
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
}
