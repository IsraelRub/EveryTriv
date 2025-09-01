import { config } from 'dotenv';
import { RedisOptions } from 'ioredis';

import { REDIS_CONSTANTS } from '../shared/constants';

config();

export const redisConfig: RedisOptions = {
	host: REDIS_CONSTANTS.CONNECTION.HOST,
	port: REDIS_CONSTANTS.CONNECTION.PORT,
	password: REDIS_CONSTANTS.CONNECTION.PASSWORD,
	db: REDIS_CONSTANTS.CONNECTION.DB,
	keyPrefix: 'everytriv:',
	retryStrategy: (times: number) => {
		// Retry with exponential backoff
		const delay = Math.min(times * 50, 2000);
		return delay;
	},
	reconnectOnError: (err: Error) => {
		// Only reconnect on specific errors
		const targetError = 'READONLY';
		return err.message.includes(targetError);
	},
	enableReadyCheck: true,
	maxRetriesPerRequest: REDIS_CONSTANTS.CONNECTION.RECONNECT_ATTEMPTS,
	enableOfflineQueue: true,
	connectTimeout: 10000,
	commandTimeout: 5000,
};
