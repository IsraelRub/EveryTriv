/**
 * Application Configuration
 *
 * @module AppConfig
 * @description Central configuration class for application settings
 * @used_by server/src/app, server/src/main, server/src/config
 */
import { DEFAULT_PORTS, LOCALHOST_URLS, PAYPAL_ENVIRONMENTS } from '@shared/constants';
import type { PayPalConfig, PayPalEnvironment } from '@shared/types';

/**
 * Application configuration class
 * @description Provides centralized access to application configuration
 * @used_by server/src/app, server/src/main, server/src/config
 */
export class AppConfig {
	static get port() {
		return parseInt(process.env.PORT || DEFAULT_PORTS.SERVER.toString(), 10);
	}

	static get nodeEnv() {
		return process.env.NODE_ENV || 'development';
	}

	static get apiVersion() {
		return process.env.API_VERSION || 'v1';
	}

	static get domain() {
		return process.env.DOMAIN || 'localhost';
	}

	static get corsOrigin() {
		return process.env.CORS_ORIGIN || LOCALHOST_URLS.CLIENT;
	}

	static get cookieSecret() {
		return process.env.COOKIE_SECRET || 'everytriv-secret-key';
	}

	static readonly apiUrl = {
		users: 'users',
		files: 'files',
	};

	static get database() {
		return {
			host: process.env.DATABASE_HOST || 'localhost',
			port: parseInt(process.env.DATABASE_PORT || DEFAULT_PORTS.DATABASE.toString(), 10),
			username: process.env.DATABASE_USERNAME || 'everytriv_user',
			password: process.env.DATABASE_PASSWORD || 'test123',
			name: process.env.DATABASE_NAME || 'everytriv',
			schema: process.env.DATABASE_SCHEMA || 'public',
			synchronize: false,
			logging: process.env.NODE_ENV !== 'prod',
			ssl: process.env.DATABASE_SSL === 'true',
			pool: {
				max: 20,
				min: 5,
				acquire: 30000,
				idle: 10000,
			},
		};
	}

	static get redis() {
		return {
			host: process.env.REDIS_HOST || 'localhost',
			port: parseInt(process.env.REDIS_PORT || '6379', 10),
			password: process.env.REDIS_PASSWORD || undefined,
			db: parseInt(process.env.REDIS_DB || '0', 10),
			keyPrefix: process.env.REDIS_KEY_PREFIX || 'everytriv:',
			retryStrategy: (times: number) => {
				const delay = Math.min(times * 50, 2000);
				return delay;
			},
			reconnectOnError: (err: Error) => {
				const targetError = 'READONLY';
				return err.message.includes(targetError);
			},
			enableReadyCheck: true,
			maxRetriesPerRequest: 3,
			enableOfflineQueue: true,
			connectTimeout: 10000,
			commandTimeout: 5000,
		};
	}

	static get jwt() {
		return {
			secret: process.env.JWT_SECRET || 'everytriv-jwt-secret',
			expiresIn: process.env.JWT_EXPIRES_IN || '1h',
			refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
		};
	}

	static get features() {
		return {
			rateLimitingEnabled: process.env.ENABLE_RATE_LIMIT !== 'false',
			aiFallbackEnabled: process.env.DISABLE_AI_FALLBACK !== 'true',
		};
	}

	static get adminCredentials() {
		return {
			email: process.env.ADMIN_EMAIL?.trim() || 'admin@example.com',
			password: process.env.ADMIN_PASSWORD ?? 'AdminPass123!',
		};
	}

	static get paypal(): PayPalConfig {
		const environmentValue = (process.env.PAYPAL_ENVIRONMENT ?? 'sandbox').toLowerCase();
		const environment: PayPalEnvironment =
			environmentValue === PAYPAL_ENVIRONMENTS.PRODUCTION
				? PAYPAL_ENVIRONMENTS.PRODUCTION
				: PAYPAL_ENVIRONMENTS.SANDBOX;

		return {
			clientId: process.env.PAYPAL_CLIENT_ID ?? '',
			clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
			merchantId: process.env.PAYPAL_MERCHANT_ID ?? '',
			environment,
		};
	}
}
