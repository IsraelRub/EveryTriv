import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SERVER_CACHE_KEYS } from '@shared/constants';
import type { CleanupTestUsersResponse, ClearOperationResponse, SavedAchievement } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { ACHIEVEMENT_DEFINITIONS } from '@internal/constants';
import {
	CreditTransactionEntity,
	GameHistoryEntity,
	PaymentHistoryEntity,
	TriviaEntity,
	UserEntity,
	UserStatsEntity,
} from '@internal/entities';
import { CacheInvalidationService, CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';

const TEST_USER_EMAIL_PATTERN = 'cli_user_%';

@Injectable()
export class DataMaintenanceService {
	constructor(
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>,
		@InjectRepository(UserStatsEntity)
		private readonly userStatsRepo: Repository<UserStatsEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(CreditTransactionEntity)
		private readonly creditTransactionRepository: Repository<CreditTransactionEntity>,
		@InjectRepository(PaymentHistoryEntity)
		private readonly paymentHistoryRepository: Repository<PaymentHistoryEntity>,
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

	async cleanupTestUsers(): Promise<CleanupTestUsersResponse> {
		try {
			const testUsers = await this.userRepository
				.createQueryBuilder('u')
				.select('u.id')
				.where('u.email LIKE :pattern', { pattern: TEST_USER_EMAIL_PATTERN })
				.getMany();

			const userIds = testUsers.map(u => u.id);
			if (userIds.length === 0) {
				return {
					success: true,
					message: 'No test users found to clean up',
					deletedUsers: 0,
					deletedGameHistory: 0,
					deletedUserStats: 0,
					deletedCreditTransactions: 0,
					deletedPaymentHistory: 0,
				};
			}

			const delCredit = await this.creditTransactionRepository
				.createQueryBuilder()
				.delete()
				.from(CreditTransactionEntity)
				.where('user_id IN (:...userIds)', { userIds })
				.execute();
			const deletedCreditTransactions = VALIDATORS.number(delCredit.affected) ? delCredit.affected : 0;

			const delPayment = await this.paymentHistoryRepository
				.createQueryBuilder()
				.delete()
				.from(PaymentHistoryEntity)
				.where('user_id IN (:...userIds)', { userIds })
				.execute();
			const deletedPaymentHistory = VALIDATORS.number(delPayment.affected) ? delPayment.affected : 0;

			const delGame = await this.gameHistoryRepository
				.createQueryBuilder()
				.delete()
				.from(GameHistoryEntity)
				.where('user_id IN (:...userIds)', { userIds })
				.execute();
			const deletedGameHistory = VALIDATORS.number(delGame.affected) ? delGame.affected : 0;

			const delStats = await this.userStatsRepo
				.createQueryBuilder()
				.delete()
				.from(UserStatsEntity)
				.where('user_id IN (:...userIds)', { userIds })
				.execute();
			const deletedUserStats = VALIDATORS.number(delStats.affected) ? delStats.affected : 0;

			await this.triviaRepository
				.createQueryBuilder()
				.update(TriviaEntity)
				.set({ userId: null })
				.where('user_id IN (:...userIds)', { userIds })
				.execute();

			const delUsers = await this.userRepository
				.createQueryBuilder()
				.delete()
				.from(UserEntity)
				.where('email LIKE :pattern', { pattern: TEST_USER_EMAIL_PATTERN })
				.execute();
			const deletedUsers = VALIDATORS.number(delUsers.affected) ? delUsers.affected : 0;

			for (const userId of userIds) {
				try {
					await this.cacheService.delete(SERVER_CACHE_KEYS.USER.PROFILE(userId));
					await this.cacheService.delete(SERVER_CACHE_KEYS.USER.STATS(userId));
					await this.cacheService.delete(SERVER_CACHE_KEYS.USER.CREDITS(userId));
					await this.cacheService.delete(SERVER_CACHE_KEYS.GAME_HISTORY.USER(userId));
				} catch (cacheError) {
					logger.cacheError('cleanupTestUsers cache delete', userId, {
						errorInfo: { message: getErrorMessage(cacheError) },
					});
				}
			}
			try {
				await this.cacheInvalidationService.invalidateOnAnalyticsUpdate();
			} catch (cacheError) {
				logger.cacheError('invalidateOnAnalyticsUpdate', 'cleanupTestUsers', {
					errorInfo: { message: getErrorMessage(cacheError) },
				});
			}

			logger.analyticsStats('maintenance_cleanup_test_users', {
				deletedUsers,
				deletedGameHistory,
				deletedUserStats,
				deletedCreditTransactions,
				deletedPaymentHistory,
			});

			return {
				success: true,
				message: `Test users cleanup completed: ${deletedUsers} users removed`,
				deletedUsers,
				deletedGameHistory,
				deletedUserStats,
				deletedCreditTransactions,
				deletedPaymentHistory,
			};
		} catch (error) {
			logger.userError('Failed to cleanup test users', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	/**
	 * Removes from user.achievements any id that no longer exists in ACHIEVEMENT_DEFINITIONS.
	 * Run after removing achievements from the server definitions (e.g. ach-accuracy-master).
	 */
	async cleanupObsoleteAchievements(): Promise<{ usersUpdated: number; totalIdsRemoved: number }> {
		const validIds = new Set(Object.keys(ACHIEVEMENT_DEFINITIONS));

		const users = await this.userRepository.find({
			select: ['id', 'achievements'],
		});

		let usersUpdated = 0;
		let totalIdsRemoved = 0;

		for (const user of users) {
			const raw = user.achievements;
			const current: SavedAchievement[] = Array.isArray(raw) ? raw : [];
			if (current.length === 0) continue;

			const filtered = current.filter(ach => ach?.id && validIds.has(ach.id));
			const removed = current.length - filtered.length;
			if (removed === 0) continue;

			user.achievements = filtered;
			await this.userRepository.save(user);
			usersUpdated += 1;
			totalIdsRemoved += removed;

			try {
				await this.cacheInvalidationService.invalidateOnAnalyticsUpdate(user.id);
			} catch (cacheError) {
				logger.cacheError('cleanupObsoleteAchievements invalidate', user.id, {
					errorInfo: { message: getErrorMessage(cacheError) },
				});
			}
		}

		logger.analyticsStats('maintenance_cleanup_obsolete_achievements', {
			data: { usersUpdated, totalIdsRemoved },
		});

		return { usersUpdated, totalIdsRemoved };
	}
}
