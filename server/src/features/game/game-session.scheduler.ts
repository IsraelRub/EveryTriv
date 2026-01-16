import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { TIME_DURATIONS_SECONDS } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { StorageService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';

import { GameService } from './game.service';

@Injectable()
export class GameSessionScheduler {
	constructor(
		private readonly gameService: GameService,
		private readonly storageService: StorageService
	) {}

	@Cron(CronExpression.EVERY_5_MINUTES)
	async finalizeStaleSessions(): Promise<void> {
		try {
			logger.gameInfo('Checking for stale game sessions');

			// Get all session keys matching the pattern
			const keysResult = await this.storageService.getKeys();

			if (!keysResult.success || !keysResult.data) {
				logger.gameError('Failed to get session keys for stale check', {
					errorInfo: { message: keysResult.error },
				});
				return;
			}

			// Filter to only session keys
			const sessionKeys = keysResult.data.filter(key => key.includes('active_game_session:'));

			if (sessionKeys.length === 0) {
				logger.gameInfo('No active sessions found');
				return;
			}

			// Check each session and finalize if stale
			const staleThreshold = Date.now() - TIME_DURATIONS_SECONDS.HOUR * 1000; // 1 hour ago
			let finalizedCount = 0;

			for (const sessionKey of sessionKeys) {
				try {
					const sessionResult = await this.storageService.get(sessionKey);
					if (!sessionResult.success || !sessionResult.data) {
						continue;
					}

					const sessionData = sessionResult.data;
					if (
						!sessionData ||
						typeof sessionData !== 'object' ||
						Array.isArray(sessionData) ||
						sessionData instanceof Date
					) {
						continue;
					}
					const sessionRecord = sessionData as Record<string, unknown>;
					const session: { startedAt?: string; userId?: string; gameId?: string } = {
						startedAt: typeof sessionRecord.startedAt === 'string' ? sessionRecord.startedAt : undefined,
						userId: typeof sessionRecord.userId === 'string' ? sessionRecord.userId : undefined,
						gameId: typeof sessionRecord.gameId === 'string' ? sessionRecord.gameId : undefined,
					};
					if (!session.startedAt || !session.userId || !session.gameId) {
						continue;
					}

					const startedAt = new Date(session.startedAt).getTime();
					if (startedAt < staleThreshold) {
						// Session is stale, finalize it
						logger.gameInfo('Finalizing stale game session', {
							gameId: session.gameId,
							userId: session.userId,
							startedAt: session.startedAt,
						});

						try {
							await this.gameService.finalizeGameSession(session.userId, session.gameId);
							finalizedCount++;
						} catch (error) {
							logger.gameError('Failed to finalize stale session', {
								errorInfo: { message: getErrorMessage(error) },
								gameId: session.gameId,
								userId: session.userId,
							});
						}
					}
				} catch (error) {
					logger.gameError('Error checking session', {
						errorInfo: { message: getErrorMessage(error) },
						sessionKey,
					});
				}
			}

			if (finalizedCount > 0) {
				logger.gameInfo('Stale session check completed', {
					totalSessions: sessionKeys.length,
					finalizedCount,
				});
			} else {
				logger.gameInfo('Stale session check completed - no stale sessions found', {
					totalSessions: sessionKeys.length,
				});
			}
		} catch (error) {
			logger.gameError('Failed to finalize stale sessions', {
				errorInfo: { message: getErrorMessage(error) },
			});
		}
	}
}
