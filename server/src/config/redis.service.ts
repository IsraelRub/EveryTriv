import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs/redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly defaultTTL = 3600; // 1 hour in seconds

  constructor(@InjectRedis() private readonly redis: Redis) {}

  private getKey(key: string): string {
    return `everytriv:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Error getting key ${key} from Redis:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const data = JSON.stringify(value);
      await this.redis.set(this.getKey(key), data, 'EX', ttl);
    } catch (error) {
      this.logger.error(`Error setting key ${key} in Redis:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from Redis:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(this.getKey(key));
      return exists === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key} in Redis:`, error);
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const value = await factory();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}:`, error);
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
    try {
      const data = JSON.stringify(message);
      return await this.redis.publish(channel, data);
    } catch (error) {
      this.logger.error(`Error publishing to channel ${channel}:`, error);
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.redis.subscribe(channel);
      this.redis.on('message', (chan, message) => {
        if (chan === channel) {
          try {
            const data = JSON.parse(message);
            callback(data);
          } catch (error) {
            this.logger.error(`Error parsing message from channel ${channel}:`, error);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error subscribing to channel ${channel}:`, error);
      throw error;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.redis.unsubscribe(channel);
    } catch (error) {
      this.logger.error(`Error unsubscribing from channel ${channel}:`, error);
      throw error;
    }
  }
}