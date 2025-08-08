/**
 * Database-related constants
 */
export const DATABASE_CONSTANTS = {
  /**
   * Entity relationship table names
   */
  TABLES: {
    USERS: 'users',
    TRIVIA: 'trivia',
    USER_STATS: 'user_stats',
    ACHIEVEMENTS: 'achievements',
    USER_ACHIEVEMENTS: 'user_achievements',
    FAVORITES: 'favorites',
  },
  
  /**
   * Default database configuration values
   */
  CONFIG: {
    CONNECTION_TIMEOUT: 30000,
    QUERY_TIMEOUT: 10000,
    POOL_SIZE: {
      MIN: 5,
      MAX: 20
    }
  },
  
  /**
   * Retry policy for database connections
   */
  RETRY_POLICY: {
    MAX_RETRIES: 5,
    RETRY_DELAY: 1000,
    TIMEOUT: 30000,
  },
} as const;
