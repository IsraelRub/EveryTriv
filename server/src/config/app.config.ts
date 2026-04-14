import type { DataSourceOptions } from 'typeorm';

import { ERROR_MESSAGES, LOCALHOST_CONFIG, PayPalEnvironment } from '@shared/constants';

import {
	AUTH_CONSTANTS,
	DATABASE_DEFAULTS,
	DATABASE_POOL_CONFIG,
	REDIS_DEFAULTS,
	REDIS_RETRY_STRATEGY_CONFIG,
} from '@internal/constants';
import type { PayPalConfig } from '@internal/types';

export class AppConfig {
	static get port() {
		return parseInt(process.env.PORT ?? LOCALHOST_CONFIG.ports.SERVER.toString(), 10);
	}

	static get nodeEnv() {
		return process.env.NODE_ENV ?? 'production';
	}

	/**
	 * Production-like runtime (strict secrets, OAuth URL warnings).
	 * Accepts `production` and common alias `prod`; not the same as PayPal env.
	 */
	static get isProductionRuntime(): boolean {
		const normalized = (process.env.NODE_ENV ?? 'production').trim().toLowerCase();
		return normalized === 'production' || normalized === 'prod';
	}

	static get domain() {
		return process.env.DOMAIN ?? LOCALHOST_CONFIG.hosts.DOMAIN;
	}

	static get apiPublicBaseUrl(): string {
		return process.env.API_PUBLIC_BASE_URL ?? process.env.SERVER_URL ?? LOCALHOST_CONFIG.urls.SERVER;
	}

	static get corsOrigin() {
		return process.env.CORS_ORIGIN ?? process.env.CLIENT_URL ?? LOCALHOST_CONFIG.urls.CLIENT;
	}

	static get cookieSecret() {
		return process.env.COOKIE_SECRET;
	}

	static get database() {
		const password = process.env.DATABASE_PASSWORD;
		if (!password || typeof password !== 'string') {
			throw new Error(ERROR_MESSAGES.config.DATABASE_PASSWORD_REQUIRED);
		}
		return {
			host: process.env.DATABASE_HOST ?? LOCALHOST_CONFIG.hosts.DATABASE,
			port: parseInt(process.env.DATABASE_PORT ?? LOCALHOST_CONFIG.ports.DATABASE.toString(), 10),
			username: process.env.DATABASE_USERNAME ?? DATABASE_DEFAULTS.username,
			password,
			name: process.env.DATABASE_NAME ?? DATABASE_DEFAULTS.name,
			schema: process.env.DATABASE_SCHEMA ?? DATABASE_DEFAULTS.schema,
			synchronize: DATABASE_DEFAULTS.synchronize,
			logging: process.env.DATABASE_LOGGING === 'true',
			ssl: process.env.DATABASE_SSL === 'true',
			pool: DATABASE_POOL_CONFIG,
		};
	}

	static createTypeOrmDataSourceOptions(): DataSourceOptions {
		const db = AppConfig.database;
		const { name, pool, ...connection } = db;
		return {
			type: 'postgres',
			...connection,
			database: name,
			entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
			migrations: [`${__dirname}/../migrations/*{.ts,.js}`],
			extra: { ...pool },
		};
	}

	static get redis() {
		return {
			host: process.env.REDIS_HOST ?? LOCALHOST_CONFIG.hosts.REDIS,
			port: parseInt(process.env.REDIS_PORT ?? LOCALHOST_CONFIG.ports.REDIS.toString(), 10),
			password: process.env.REDIS_PASSWORD ?? undefined,
			db: parseInt(process.env.REDIS_DB ?? REDIS_DEFAULTS.db.toString(), 10),
			keyPrefix: process.env.REDIS_KEY_PREFIX ?? REDIS_DEFAULTS.keyPrefix,
			retryStrategy: (times: number) => {
				const delay = Math.min(
					times * REDIS_RETRY_STRATEGY_CONFIG.delayMultiplier,
					REDIS_RETRY_STRATEGY_CONFIG.maxDelay
				);
				return delay;
			},
			reconnectOnError: (err: Error) => {
				return err.message.includes(REDIS_RETRY_STRATEGY_CONFIG.targetError);
			},
			enableReadyCheck: REDIS_DEFAULTS.enableReadyCheck,
			maxRetriesPerRequest: REDIS_DEFAULTS.maxRetriesPerRequest,
			enableOfflineQueue: REDIS_DEFAULTS.enableOfflineQueue,
			connectTimeout: REDIS_DEFAULTS.connectTimeout,
			commandTimeout: REDIS_DEFAULTS.commandTimeout,
		};
	}

	static get jwt() {
		return {
			secret: process.env.JWT_SECRET,
			expiresIn: process.env.JWT_EXPIRES_IN ?? AUTH_CONSTANTS.JWT_EXPIRATION,
			refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? AUTH_CONSTANTS.JWT_REFRESH_EXPIRATION,
		};
	}

	static get features() {
		return {
			rateLimitingEnabled: process.env.ENABLE_RATE_LIMIT !== 'false',
			aiFallbackEnabled: process.env.DISABLE_AI_FALLBACK !== 'true',
			bypassRateLimitForLocalhost: process.env.DISABLE_RATE_LIMIT_FOR_LOCALHOST !== 'false',
		};
	}

	static get paypal(): PayPalConfig {
		const environmentValue = (process.env.PAYPAL_ENVIRONMENT ?? PayPalEnvironment.PRODUCTION).toLowerCase();
		const environment: PayPalEnvironment =
			environmentValue === PayPalEnvironment.PRODUCTION ? PayPalEnvironment.PRODUCTION : PayPalEnvironment.SANDBOX;

		return {
			clientId: process.env.PAYPAL_CLIENT_ID ?? '',
			clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
			merchantId: process.env.PAYPAL_MERCHANT_ID ?? '',
			environment,
		};
	}
}
