/**
 * Server Configuration Index
 *
 * @module ServerConfig
 * @description Central export point for all server configuration modules
 * @used_by server/app, server/features, server/services
 */

/**
 * Application configuration
 * @description Main application configuration settings
 * @used_by server/app, server/features
 */
export * from './app.config';

/**
 * Database configuration
 * @description Database connection and configuration settings
 * @used_by server/features, server/entities
 */
export * from './database.config';

/**
 * Redis configuration
 * @description Redis connection and configuration settings
 * @used_by server/features, server/services
 */
export * from './redis.config';

/**
 * Data source configuration
 * @description TypeORM data source configuration
 * @used_by server/features, server/entities
 */
export * from './dataSource';

/**
 * Redis service
 * @description Redis service for caching and session management
 * @used_by server/features, server/services
 */

/**
 * Redis module
 * @description Redis module configuration
 * @used_by server/app, server/features
 */
export * from './redis.module';

/**
 * Global exception filter
 * @description Global exception handling and error responses
 * @used_by server/app, server/features
 */
export * from './globalException.filter';
