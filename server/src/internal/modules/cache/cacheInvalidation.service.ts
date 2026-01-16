import { Injectable } from '@nestjs/common';

import { SERVER_CACHE_KEYS } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { CacheService } from './cache.service';

@Injectable()
export class CacheInvalidationService {
	constructor(private readonly cacheService: CacheService) {}

	async invalidateOnGameComplete(userId: string): Promise<void> {
		try {
			const invalidationPromises: Promise<unknown>[] = [
				// Analytics caches
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.ANALYTICS.GLOBAL_DIFFICULTY),
				this.cacheService.delete(SERVER_CACHE_KEYS.ANALYTICS.USER(userId)),
				this.cacheService.delete(SERVER_CACHE_KEYS.ANALYTICS.GLOBAL_STATS),
				this.cacheService.delete(SERVER_CACHE_KEYS.ANALYTICS.BUSINESS_METRICS),
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.ANALYTICS.TOPICS_STATS_PATTERN),

				// Leaderboard caches
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.LEADERBOARD.ALL_PATTERN),

				// Game History caches
				this.cacheService.delete(SERVER_CACHE_KEYS.GAME_HISTORY.USER_WITH_PREFIX(userId)),
				this.cacheService.delete(SERVER_CACHE_KEYS.GAME_HISTORY.USER(userId)),
			];

			await Promise.allSettled(invalidationPromises);

			logger.cacheInfo('Cache invalidated on game completion', {
				userId,
				keysInvalidated: invalidationPromises.length,
			});
		} catch (error) {
			logger.cacheError('Failed to invalidate caches on game completion', userId, {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
		}
	}

	async invalidateOnUserCreated(): Promise<void> {
		try {
			const invalidationPromises: Promise<unknown>[] = [
				this.cacheService.delete(SERVER_CACHE_KEYS.ANALYTICS.GLOBAL_STATS),
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.LEADERBOARD.ALL_PATTERN),
			];

			await Promise.allSettled(invalidationPromises);

			logger.cacheInfo('Cache invalidated on user created', {
				keysInvalidated: invalidationPromises.length,
			});
		} catch (error) {
			logger.cacheError('Failed to invalidate caches on user created', 'user.created', {
				errorInfo: { message: getErrorMessage(error) },
			});
		}
	}

	async invalidateOnLeaderboardUpdate(userId?: string): Promise<void> {
		try {
			const invalidationPromises: Promise<unknown>[] = [
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.LEADERBOARD.ALL_PATTERN),
			];

			await Promise.allSettled(invalidationPromises);

			logger.cacheInfo('Cache invalidated on leaderboard update', {
				userId: userId ?? 'all',
				keysInvalidated: invalidationPromises.length,
			});
		} catch (error) {
			logger.cacheError('Failed to invalidate caches on leaderboard update', userId ?? 'all', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
		}
	}

	async invalidateOnAnalyticsUpdate(userId?: string): Promise<void> {
		try {
			const invalidationPromises: Promise<unknown>[] = [
				this.cacheService.delete(SERVER_CACHE_KEYS.ANALYTICS.GLOBAL_STATS),
				this.cacheService.delete(SERVER_CACHE_KEYS.ANALYTICS.BUSINESS_METRICS),
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.ANALYTICS.GLOBAL_DIFFICULTY),
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.ANALYTICS.TOPICS_STATS_PATTERN),
			];

			if (userId) {
				invalidationPromises.push(this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.ANALYTICS.USER(userId)));
			}

			await Promise.allSettled(invalidationPromises);

			logger.cacheInfo('Cache invalidated on analytics update', {
				userId: userId ?? 'all',
				keysInvalidated: invalidationPromises.length,
			});
		} catch (error) {
			logger.cacheError('Failed to invalidate caches on analytics update', userId ?? 'all', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
		}
	}

	async invalidateAll(): Promise<void> {
		try {
			const invalidationPromises: Promise<unknown>[] = [
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.ANALYTICS.ALL_PATTERN),
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.LEADERBOARD.ALL_PATTERN),
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.GAME_HISTORY.ALL_PATTERN),
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.TRIVIA.ALL_PATTERN),
				this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.USER_STATS.ALL_PATTERN),
			];

			await Promise.allSettled(invalidationPromises);

			logger.cacheInfo('All caches invalidated', {
				keysInvalidated: invalidationPromises.length,
			});
		} catch (error) {
			logger.cacheError('Failed to invalidate all caches', 'invalidateAll', {
				errorInfo: { message: getErrorMessage(error) },
			});
		}
	}
}
