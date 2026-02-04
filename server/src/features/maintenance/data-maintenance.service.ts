import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SERVER_CACHE_KEYS, VALIDATORS } from '@shared/constants';
import type { ClearOperationResponse } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { GameHistoryEntity, TriviaEntity, UserStatsEntity } from '@internal/entities';
import { CacheInvalidationService, CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';

@Injectable()
export class DataMaintenanceService {
	constructor(
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>,
		@InjectRepository(UserStatsEntity)
		private readonly userStatsRepo: Repository<UserStatsEntity>,
		private readonly cacheService: CacheService,
		private readonly cacheInvalidationService: CacheInvalidationService
	) {}

	async clearAllGameHistory(): Promise<ClearOperationResponse> {
		try {
			const totalBefore = await this.gameHistoryRepository.count();

			if (totalBefore === 0) {
				try {
					await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.GAME_HISTORY.ALL_PATTERN);
					await this.cacheInvalidationService.invalidateOnAnalyticsUpdate();
				} catch (cacheError) {
					logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.GAME_HISTORY.ALL_PATTERN, {
						errorInfo: { message: getErrorMessage(cacheError) },
					});
				}
				return {
					success: true,
					message: 'No game history records found',
					deletedCount: 0,
				};
			}

			await this.gameHistoryRepository.clear();

			try {
				const cacheDeleted = await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.GAME_HISTORY.ALL_PATTERN);
				if (cacheDeleted > 0) {
					logger.cacheInfo(`Game history cache cleared: ${cacheDeleted} keys deleted`);
				}
				await this.cacheInvalidationService.invalidateOnAnalyticsUpdate();
			} catch (cacheError) {
				logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.GAME_HISTORY.ALL_PATTERN, {
					errorInfo: { message: getErrorMessage(cacheError) },
				});
			}

			logger.analyticsStats('maintenance_clear_game_history', {
				deletedCount: totalBefore,
			});

			return {
				success: true,
				message: 'All game history records removed successfully',
				deletedCount: totalBefore,
			};
		} catch (error) {
			logger.gameError('Failed to clear all game history', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async clearAllTrivia(): Promise<ClearOperationResponse> {
		try {
			const totalBefore = await this.triviaRepository.count();

			if (totalBefore === 0) {
				try {
					await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.TRIVIA.ALL_PATTERN);
				} catch (cacheError) {
					logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.TRIVIA.ALL_PATTERN, {
						errorInfo: { message: getErrorMessage(cacheError) },
					});
				}
				return {
					success: true,
					message: 'No trivia records found',
					deletedCount: 0,
				};
			}

			await this.triviaRepository.clear();

			try {
				const cacheDeleted = await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.TRIVIA.ALL_PATTERN);
				if (cacheDeleted > 0) {
					logger.cacheInfo(`Trivia cache cleared: ${cacheDeleted} keys deleted`);
				}
			} catch (cacheError) {
				logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.TRIVIA.ALL_PATTERN, {
					errorInfo: { message: getErrorMessage(cacheError) },
				});
			}

			logger.analyticsStats('maintenance_clear_trivia', {
				deletedCount: totalBefore,
			});

			return {
				success: true,
				message: 'All trivia records removed successfully',
				deletedCount: totalBefore,
			};
		} catch (error) {
			logger.gameError('Failed to clear all trivia', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async clearAllUserStats(): Promise<ClearOperationResponse> {
		try {
			const totalBefore = await this.userStatsRepo.count();

			if (totalBefore === 0) {
				try {
					await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.USER_STATS.ALL_PATTERN);
				} catch (cacheError) {
					logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.USER_STATS.ALL_PATTERN, {
						errorInfo: { message: getErrorMessage(cacheError) },
					});
				}
				return {
					success: true,
					message: 'No user stats records found',
					deletedCount: 0,
				};
			}

			const deleteResult = await this.userStatsRepo.createQueryBuilder().delete().from(UserStatsEntity).execute();

			const deletedCount = VALIDATORS.number(deleteResult.affected) ? deleteResult.affected : totalBefore;

			try {
				const cacheDeleted = await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.USER_STATS.ALL_PATTERN);
				if (cacheDeleted > 0) {
					logger.cacheInfo(`User stats cache cleared: ${cacheDeleted} keys deleted`);
				}
				await this.cacheInvalidationService.invalidateOnAnalyticsUpdate();
			} catch (cacheError) {
				logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.USER_STATS.ALL_PATTERN, {
					errorInfo: { message: getErrorMessage(cacheError) },
				});
			}

			logger.analyticsStats('maintenance_clear_user_stats', {
				deletedCount,
			});

			return {
				success: true,
				message: 'All user stats records removed successfully',
				deletedCount,
			};
		} catch (error) {
			logger.userError('Failed to clear all user stats', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}
}
