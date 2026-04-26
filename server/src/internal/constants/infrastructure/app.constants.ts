import { TIME_PERIODS_MS } from '@shared/constants';

export const DATABASE_DEFAULTS = {
	username: 'everytriv_user',
	name: 'everytriv',
	schema: 'public',
	synchronize: false,
} as const;

export const DATABASE_POOL_CONFIG = {
	max: 20,
	min: 5,
	acquire: TIME_PERIODS_MS.THIRTY_SECONDS,
	idle: TIME_PERIODS_MS.TEN_SECONDS,
} as const;

export const REDIS_DEFAULTS = {
	db: 0,
	keyPrefix: 'everytriv:',
	enableReadyCheck: true,
	maxRetriesPerRequest: 3,
	enableOfflineQueue: true,
	connectTimeout: TIME_PERIODS_MS.TEN_SECONDS,
	commandTimeout: TIME_PERIODS_MS.FIVE_SECONDS,
} as const;

export const REDIS_RETRY_STRATEGY_CONFIG = {
	delayMultiplier: 50,
	maxDelay: TIME_PERIODS_MS.TWO_SECONDS,
	targetError: 'READONLY',
} as const;

export const ADMIN_CREDENTIALS_DEFAULTS = {
	email: 'admin@example.com',
	password: 'AdminPass123!',
	firstName: 'Admin',
	lastName: 'Tester',
} as const;
