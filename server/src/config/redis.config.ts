import { RedisOptions } from 'ioredis';
import { config } from 'dotenv';
import { log as logger } from '../shared/utils';
import { REDIS_CONSTANTS } from '../constants';

config();

// Redis events handler for logging
export const setupRedisLogger = (redisClient: any): void => {
  redisClient.on('connect', () => {
    logger.info('Redis client connecting', { 
      context: 'Redis',
      host: redisClient.options.host,
      port: redisClient.options.port
    });
  });

  redisClient.on('ready', () => {
    logger.info('Redis client connected and ready', { 
      context: 'Redis',
      host: redisClient.options.host,
      port: redisClient.options.port
    });
  });

  redisClient.on('error', (err: Error) => {
    logger.error(`Redis client error: ${err.message}`, { 
      context: 'Redis',
      error: err
    });
  });

  redisClient.on('reconnecting', (delay: number) => {
    logger.warn(`Redis client reconnecting in ${delay}ms`, { 
      context: 'Redis',
      delay
    });
  });

  redisClient.on('end', () => {
    logger.info('Redis client connection closed', { 
      context: 'Redis'
    });
  });
};

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
  }