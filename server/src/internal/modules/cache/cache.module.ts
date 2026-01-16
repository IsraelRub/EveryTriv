import { Global, Module, OnModuleInit } from '@nestjs/common';

import { serverLogger as logger } from '@internal/services';

import { RedisModule } from '../redis.module';
import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';
import { CacheInvalidationService } from './cacheInvalidation.service';

@Global()
@Module({
	imports: [RedisModule],
	controllers: [CacheController],
	providers: [CacheService, CacheInvalidationService],
	exports: [CacheService, CacheInvalidationService],
})
export class CacheModule implements OnModuleInit {
	onModuleInit() {
		logger.systemInfo('Cache module initialized', {
			module: 'CacheModule',
			dependencies: ['RedisModule'],
		});
	}
}
