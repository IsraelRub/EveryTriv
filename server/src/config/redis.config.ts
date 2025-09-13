import { RedisOptions } from 'ioredis';

import { AppConfig } from './app.config';

export const redisConfig: RedisOptions = {
	host: AppConfig.redis.host,
	port: AppConfig.redis.port,
	password: AppConfig.redis.password,
	db: AppConfig.redis.db,
	keyPrefix: AppConfig.redis.keyPrefix,
	retryStrategy: AppConfig.redis.retryStrategy,
	reconnectOnError: AppConfig.redis.reconnectOnError,
	enableReadyCheck: AppConfig.redis.enableReadyCheck,
	maxRetriesPerRequest: AppConfig.redis.maxRetriesPerRequest,
	enableOfflineQueue: AppConfig.redis.enableOfflineQueue,
	connectTimeout: AppConfig.redis.connectTimeout,
	commandTimeout: AppConfig.redis.commandTimeout,
};
