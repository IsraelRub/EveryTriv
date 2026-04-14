import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { CACHE_KEYS, TIME_PERIODS_MS } from '@shared/constants';
import { getErrorMessage, isRecord } from '@shared/utils';

import { StorageService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import { hasSessionBasicFields } from '@internal/utils';

import { GameService } from '../../game/game.service';

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

			const keysResult = await this.storageService.getKeysByRelativePattern(CACHE_KEYS.GAME.SESSION_PATTERN);

			if (!keysResult.success || !keysResult.data) {
				logger.gameError('Failed to get session keys for stale check', {
					errorInfo: { message: keysResult.error },
				});
				return;
			}

			const sessionKeys = keysResult.data;

			if (sessionKeys.length === 0) {
				logger.gameInfo('No active sessions found');
				return;
			}

			// Check each session and finalize if stale
			const staleThreshold = Date.now() - TIME_PERIODS_MS.HOUR;
			let finalizedCount = 0;

			for (const sessionKey of sessionKeys) {
				try {
					const sessionResult = await this.storageService.get(sessionKey);
					if (!sessionResult.success || !sessionResult.data) {
						continue;
					}

					const sessionData = sessionResult.data;
					if (!sessionData || !isRecord(sessionData) || sessionData instanceof Date) {
						continue;
					}

					if (!hasSessionBasicFields(sessionData)) {
						continue;
					}

					const startedAt = new Date(sessionData.startedAt).getTime();
					if (startedAt < staleThreshold) {
						// Session is stale, finalize it
						logger.gameInfo('Finalizing stale game session', {
							gameId: sessionData.gameId,
							userId: sessionData.userId,
							startedAt: sessionData.startedAt,
						});

						try {
							await this.gameService.finalizeGameSession(sessionData.userId, sessionData.gameId);
							finalizedCount++;
						} catch (error) {
							logger.gameError('Failed to finalize stale session', {
								errorInfo: { message: getErrorMessage(error) },
								gameId: sessionData.gameId,
								userId: sessionData.userId,
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
