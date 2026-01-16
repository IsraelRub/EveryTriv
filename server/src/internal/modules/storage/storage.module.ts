import { BadRequestException, Module } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { ERROR_CODES } from '@shared/constants';

import { MetricsService } from '@internal/services';

import { RedisModule } from '../redis.module';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
	imports: [RedisModule],
	controllers: [StorageController],
	providers: [
		{
			provide: StorageService,
			useFactory: (redisClient: Redis | null) => {
				if (!redisClient) {
					throw new BadRequestException(ERROR_CODES.REDIS_CLIENT_REQUIRED);
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
