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
import { serverLogger as logger } from '@shared';
import { redisConfig } from '../../config/redis.config';
import type { RedisClient } from '@shared/types/infrastructure/redis.types';

@Global()
@Module({
	providers: [
		{
			provide: 'REDIS_CLIENT',
			useFactory: (): RedisClient | null => {
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
						host: redisConfig.host,
						port: redisConfig.port,
					});
				});

				redisClient.on('reconnecting', (delay: number) => {
					logger.systemError(`Redis client reconnecting in ${delay}ms`, {
						delay,
						host: redisConfig.host,
						port: redisConfig.port,
					});
				});

				redisClient.on('end', () => {
					logger.system('Redis client connection closed', {
						host: redisConfig.host,
						port: redisConfig.port,
					});
				});

				return redisClient as RedisClient;
			},
		},
	],
	exports: ['REDIS_CLIENT'],
})
export class RedisModule implements OnModuleInit {
	constructor() {}

	onModuleInit() {
		logger.system('Redis module initialized', {
			host: redisConfig.host,
			port: redisConfig.port,
			password: redisConfig.password ? '***' : 'not set',
			db: redisConfig.db,
			keyPrefix: redisConfig.keyPrefix,
			connectTimeout: redisConfig.connectTimeout,
			commandTimeout: redisConfig.commandTimeout,
		});
	}
}
