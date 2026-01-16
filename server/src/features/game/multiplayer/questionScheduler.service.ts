import { Injectable, OnModuleDestroy } from '@nestjs/common';

import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';
import type { QuestionSchedule } from '@internal/types';

@Injectable()
export class QuestionSchedulerService implements OnModuleDestroy {
	private readonly activeSchedules = new Map<string, QuestionSchedule>();

	scheduleAnswerCheck(
		roomId: string,
		checkIntervalMs: number,
		checkCallback: () => Promise<boolean>,
		endCallback: () => Promise<void>
	): void {
		this.cancelSchedule(roomId);

		// eslint-disable-next-line prefer-const -- checkIntervalId is assigned on line 43
		let checkIntervalId: NodeJS.Timeout | undefined;

		const timeoutId = setTimeout(async () => {
			try {
				if (checkIntervalId) {
					clearInterval(checkIntervalId);
				}
				this.activeSchedules.delete(roomId);
				await endCallback();
			} catch (error) {
				logger.gameError('Question end callback failed (timeout)', {
					errorInfo: { message: getErrorMessage(error) },
					roomId,
				});
			}
		}, checkIntervalMs * 100); // Fallback: 100x check interval

		checkIntervalId = setInterval(async () => {
			try {
				const allAnswered = await checkCallback();
				if (allAnswered) {
					if (checkIntervalId) {
						clearInterval(checkIntervalId);
					}
					clearTimeout(timeoutId);
					this.activeSchedules.delete(roomId);
					await endCallback();
				}
			} catch (error) {
				logger.gameError('Answer check callback failed', {
					errorInfo: { message: getErrorMessage(error) },
					roomId,
				});
			}
		}, checkIntervalMs);

		this.activeSchedules.set(roomId, {
			timeoutId,
			checkInterval: checkIntervalId,
			roomId,
			startedAt: new Date(),
		});
	}

	cancelSchedule(roomId: string): void {
		const schedule = this.activeSchedules.get(roomId);
		if (schedule) {
			clearTimeout(schedule.timeoutId);
			if (schedule.checkInterval) {
				clearInterval(schedule.checkInterval);
			}
			this.activeSchedules.delete(roomId);
		}
	}

	onModuleDestroy(): void {
		for (const [roomId, schedule] of this.activeSchedules.entries()) {
			clearTimeout(schedule.timeoutId);
			if (schedule.checkInterval) {
				clearInterval(schedule.checkInterval);
			}
			logger.gameInfo('Cleaned up question schedule on module destroy', {
				roomId,
			});
		}
		this.activeSchedules.clear();
	}
}
