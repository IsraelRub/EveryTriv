/**
 * Cache Module
 *
 * @module CacheModule
 * @description Module for cache operations, handling cache management, statistics, and cache invalidation
 * @used_by server/features, server/controllers, server/services
 * @dependencies StorageModule, RedisModule
 */
import { forwardRef,Module, OnModuleInit } from '@nestjs/common';

import { RedisModule } from '../../../config/redis.module';
import { LoggerService } from '../../controllers';
import { StorageModule } from '../storage';
import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';

@Module({
	imports: [forwardRef(() => StorageModule), forwardRef(() => RedisModule)],
	controllers: [CacheController],
	providers: [CacheService, LoggerService],
	exports: [CacheService],
})
export class CacheModule implements OnModuleInit {
	onModuleInit() {}
}
