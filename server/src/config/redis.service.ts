import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { LoggerService } from '../shared/modules/logger/logger.service';
import { setupRedisLogger } from './redis.config';

@Injectable()
export class RedisService {
  private readonly defaultTTL = 3600; // 1 hour in seconds

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly logger: LoggerService
  ) {
    // Set up Redis event logging
    setupRedisLogger(this.redis);
  }

  private getKey(key: string): string {
    return `everytriv:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const data = await this.redis.get(this.getKey(key));
      const duration = Date.now() - startTime;
      
      if (duration > 100) { // Log slow operations
        this.logger.logPerformance('redis.get', duration, { key });
      }
      
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Error getting key ${key} from Redis:`, { error, key });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    const startTime = Date.now();
    try {
      const data = JSON.stringify(value);
      await this.redis.set(this.getKey(key), data, 'EX', ttl);
      
      const duration = Date.now() - startTime;
      if (duration > 100) { // Log slow operations
        this.logger.logPerformance('redis.set', duration, { key, ttl });
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key} in Redis:`, { error, key, ttl });
    }
  }

  async del(key: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.redis.del(this.getKey(key));
      
      const duration = Date.now() - startTime;
      if (duration > 100) { // Log slow operations
        this.logger.logPerformance('redis.del', duration, { key });
      }
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from Redis:`, { error, key });
    }
  }

  async exists(key: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      const exists = await this.redis.exists(this.getKey(key));
      
      const duration = Date.now() - startTime;
      if (duration > 100) { // Log slow operations
        this.logger.logPerformance('redis.exists', duration, { key });
      }
      
      return exists === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key} in Redis:`, { error, key });
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        this.logger.debug(`Cache hit for key ${key}`, { 
          context: 'Redis', 
          key,
          duration: Date.now() - startTime 
        });
        return cached;
      }

      this.logger.debug(`Cache miss for key ${key}`, { 
        context: 'Redis', 
        key 
      });
      
      const factoryStartTime = Date.now();
      const value = await factory();
      const factoryDuration = Date.now() - factoryStartTime;
      
      await this.set(key, value, ttl);
      
      const totalDuration = Date.now() - startTime;
      this.logger.logPerformance('redis.getOrSet', totalDuration, { 
        key, 
        factoryDuration,
        ttl,
        cacheHit: false 
      });
      
      return value;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}:`, { error, key, ttl });
      throw error;
    }
  }

  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    try {
      const redisKeys = keys.map(key => this.getKey(key));
      const values = await this.redis.mget(redisKeys);
      return values.map(value => (value ? JSON.parse(value) : null));
    } catch (error) {
      this.logger.error('Error in mget:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValues: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      keyValues.forEach(({ key, value, ttl = this.defaultTTL }) => {
        const data = JSON.stringify(value);
        pipeline.set(this.getKey(key), data, 'EX', ttl);
      });

      await pipeline.exec();
    } catch (error) {
      this.logger.error('Error in mset:', error);
    }
  }

  async increment(key: string, value: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(this.getKey(key), value);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(this.getKey(key), ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting expiry for key ${key}:`, error);
      return false;
    }
  }

  async publish(channel: string, message: any): Promise<number> {
    const startTime = Date.now();
    try {
      const data = JSON.stringify(message);
      const result = await this.redis.publish(channel, data);
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Published to channel ${channel}`, { 
        context: 'Redis', 
        channel, 
        subscribers: result,
        duration
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Error publishing to channel ${channel}:`, { 
        error, 
        channel, 
        messageType: typeof message 
      });
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.redis.subscribe(channel);
      this.logger.info(`Subscribed to channel ${channel}`, { 
        context: 'Redis', 
        channel 
      });
      
      this.redis.on('message', (chan, message) => {
        if (chan === channel) {
          const messageReceivedTime = Date.now();
          try {
            const data = JSON.parse(message);
            callback(data);
            
            const processingDuration = Date.now() - messageReceivedTime;
            if (processingDuration > 100) { // Log slow message processing
              this.logger.logPerformance('redis.messageProcessing', processingDuration, { 
                channel,
                messageSize: message.length 
              });
            }
          } catch (error) {
            this.logger.error(`Error parsing message from channel ${channel}:`, { 
              error, 
              channel, 
              messageSnippet: message.substring(0, 100) 
            });
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error subscribing to channel ${channel}:`, { error, channel });
      throw error;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.redis.unsubscribe(channel);
      this.logger.info(`Unsubscribed from channel ${channel}`, { 
        context: 'Redis', 
        channel 
      });
    } catch (error) {
      this.logger.error(`Error unsubscribing from channel ${channel}:`, { error, channel });
      throw error;
    }
  }
}