import { RedisModuleOptions } from '@nestjs/redis';
import { config } from 'dotenv';

config();

export const redisConfig: RedisModuleOptions = {
  config: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: 0,
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
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
  },
};