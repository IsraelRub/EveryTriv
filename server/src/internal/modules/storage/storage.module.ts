/**
 * Storage Module
 *
 * @module storage.module
 * @description Module for persistent storage operations using Redis
 * @note This module is for PERSISTENT storage only. For caching, use CacheModule instead.
 */
import { Module, BadRequestException } from '@nestjs/common';
import { MetricsService } from '@shared';
import type { RedisClient } from '@shared/types/infrastructure/redis.types';

import { RedisModule } from '../redis.module';
import { StorageController } from './storage.controller';
import { ServerStorageService } from './storage.service';

@Module({
	imports: [RedisModule],
	controllers: [StorageController],
	providers: [
		{
			provide: ServerStorageService,
			useFactory: (redisClient: RedisClient | null) => {
				if (!redisClient) {
					throw new BadRequestException('Redis client is required for ServerStorageService');
				}
				return new ServerStorageService(redisClient, {});
			},
			inject: ['REDIS_CLIENT'],
		},
		{
			provide: MetricsService,
			useFactory: () => MetricsService.getInstance(),
		},
	],
	exports: [ServerStorageService, MetricsService],
})
export class StorageModule {}
