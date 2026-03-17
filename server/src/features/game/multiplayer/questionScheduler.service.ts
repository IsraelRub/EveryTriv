import { Injectable, OnModuleDestroy } from '@nestjs/common';

import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';
import type { QuestionSchedule } from '@internal/types';

@Injectable()
export class QuestionSchedulerService implements OnModuleDestroy {
	private readonly activeSchedules = new Map<string, QuestionSchedule>();

	scheduleQuestionEnd(roomId: string, durationMs: number, endCallback: () => Promise<void>): void {
		this.cancelSchedule(roomId);

		const handleTimeout = async () => {
			try {
				this.activeSchedules.delete(roomId);
				await endCallback();
			} catch (error) {
				logger.gameError('Question end callback failed (timeout)', {
					errorInfo: { message: getErrorMessage(error) },
					roomId,
				});
			}
		};
		const timeoutId = setTimeout(handleTimeout, durationMs);

		this.activeSchedules.set(roomId, {
			timeoutId,
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
