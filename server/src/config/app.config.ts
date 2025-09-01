/**
 * Application Configuration
 *
 * @module AppConfig
 * @description Central configuration class for application settings
 * @used_by server/app, server/main, server/config
 */
import { DEFAULT_PORTS } from 'everytriv-shared/constants';

/**
 * Application configuration class
 * @description Provides centralized access to application configuration
 * @used_by server/app, server/main, server/config
 */
export class AppConfig {
	static get port() {
		return parseInt(process.env.PORT || DEFAULT_PORTS.SERVER.toString(), 10);
	}

	// container apps prefix as in production
	static readonly apiUrl = {
		users: 'users',
		files: 'files',
	};

	// Database configuration - Unified for all development environments
	static get database() {
		return {
			host: process.env.DATABASE_HOST || 'localhost',
			port: parseInt(process.env.DATABASE_PORT || DEFAULT_PORTS.DATABASE.toString(), 10),
			username: process.env.DATABASE_USERNAME || 'everytriv_user',
			password: process.env.DATABASE_PASSWORD || 'everytriv_dev_2025',
			name: process.env.DATABASE_NAME || 'everytriv',
			schema: process.env.DATABASE_SCHEMA || 'public',
			synchronize: false, // Always use migrations for consistency
			logging: process.env.NODE_ENV !== 'prod',
			ssl: process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'prod',
			pool: {
				max: 20,
				min: 5,
				acquire: 30000,
				idle: 10000,
			},
		};
	}
}
