/**
 * Cache Module
 *
 * @module CacheModule
 * @description Module for cache operations, handling cache management, statistics, and cache invalidation
 * @used_by server/src/features, server/src/controllers, server/src/services
 * @dependencies RedisModule
 */
import { serverLogger as logger } from '@shared';

import { Module, OnModuleInit } from '@nestjs/common';

import { RedisModule } from '../redis.module';
import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';

@Module({
	imports: [RedisModule],
	controllers: [CacheController],
	providers: [CacheService],
	exports: [CacheService],
})
export class CacheModule implements OnModuleInit {
	onModuleInit() {
		logger.system('Cache module initialized', {
			module: 'CacheModule',
			dependencies: ['RedisModule'],
		});
	}
}
