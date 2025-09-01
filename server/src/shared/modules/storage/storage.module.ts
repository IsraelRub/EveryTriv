/**
 * Storage Module
 *
 * @module storage.module
 * @description Module for persistent storage operations using Redis
 * @note This module is for PERSISTENT storage only. For caching, use CacheModule instead.
 */
import { Module } from '@nestjs/common';

import { RedisModule } from '../../../config/redis.module';
import { LoggerService } from '../../controllers';
import type { RedisClient } from '../../types';
import { StorageController } from './storage.controller';
import { ServerStorageService } from './storage.service';

@Module({
	imports: [RedisModule],
	controllers: [StorageController],
	providers: [
		{
			provide: ServerStorageService,
			useFactory: (redisClient: RedisClient) => {
				return new ServerStorageService(redisClient);
			},
			inject: ['REDIS_CLIENT'],
		},
		LoggerService,
	],
	exports: [ServerStorageService],
})
export class StorageModule {}
