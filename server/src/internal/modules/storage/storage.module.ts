import { BadRequestException, Module } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { ErrorCode } from '@shared/constants';

import { MetricsService } from '@internal/services';

import { CacheModule } from '../cache';
import { RedisModule } from '../redis';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
	imports: [RedisModule, CacheModule],
	controllers: [StorageController],
	providers: [
		{
			provide: StorageService,
			useFactory: (redisClient: Redis | null) => {
				if (!redisClient) {
					throw new BadRequestException(ErrorCode.REDIS_CLIENT_REQUIRED);
				}
				return new StorageService(redisClient, {});
			},
			inject: ['REDIS_CLIENT'],
		},
		{
			provide: MetricsService,
			useFactory: () => MetricsService.getInstance(),
		},
	],
	exports: [StorageService, MetricsService],
})
export class StorageModule {}
