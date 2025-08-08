/**
 * Redis-related constants
 */
export const REDIS_CONSTANTS = {
  /**
   * Default connection options
   */
  CONNECTION: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    PASSWORD: process.env.REDIS_PASSWORD || '',
    DB: parseInt(process.env.REDIS_DB || '0', 10),
    RECONNECT_ATTEMPTS: 10,
    RECONNECT_DELAY: 1000,
  },

  /**
   * Redis key prefixes for different types of data
   */
  KEY_PREFIXES: {
    SESSION: 'session:',
    USER: 'user:',
    CACHE: 'cache:',
    RATE_LIMIT: 'rate-limit:',
    TRIVIA_QUEUE: 'trivia-queue:',
    TRIVIA_STATS: 'trivia-stats:',
  },

  /**
   * Default TTL values in seconds
   */
  TTL: {
    SESSION: 86400, // 24 hours
    CACHE_SHORT: 300, // 5 minutes
    CACHE_MEDIUM: 3600, // 1 hour
    CACHE_LONG: 86400, // 24 hours
  }
} as const;
