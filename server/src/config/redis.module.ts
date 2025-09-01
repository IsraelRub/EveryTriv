/**
 * Redis Module
 *
 * @module RedisModule
 * @description Global Redis module providing Redis client configuration and connection management
 * @used_by server/features, server/shared/modules, server/controllers
 * @global
 * @provides REDIS_CLIENT
 */
import { Global, Module, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

import { LoggerService } from '../shared/controllers';
import { redisConfig } from './redis.config';

@Global()
@Module({
	providers: [
		LoggerService,
		{
			provide: 'REDIS_CLIENT',
			useFactory: (logger: LoggerService) => {
				// Only create Redis client if Redis is configured
				if (!redisConfig.host || redisConfig.host === '') {
					logger.systemError('Redis not configured - using null client');
					return null;
				}

				const redisClient = new Redis(redisConfig);

				// Setup Redis event logging
				redisClient.on('connect', () => {
					logger.appStartup();
				});

				redisClient.on('ready', () => {
					logger.appStartup();
				});

				redisClient.on('error', (err: Error) => {
					logger.systemError(`Redis client error: ${err.message}`, {
						error: err.message,
					});
				});

				redisClient.on('reconnecting', (delay: number) => {
					logger.systemError(`Redis client reconnecting in ${delay}ms`, {
						delay,
					});
				});

				redisClient.on('end', () => {
					logger.system('Redis client connection closed', {});
				});

				return redisClient;
			},
			inject: [LoggerService],
		},
	],
	exports: ['REDIS_CLIENT'],
})
export class RedisModule implements OnModuleInit {
	constructor(private readonly logger: LoggerService) {}

	onModuleInit() {
		this.logger.system('Redis module initialized', {
			host: redisConfig.host,
			port: redisConfig.port,
			password: redisConfig.password ? '***' : 'not set',
			db: redisConfig.db,
		});
	}
}
