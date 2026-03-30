export const DATABASE_DEFAULTS = {
	username: 'everytriv_user',
	name: 'everytriv',
	schema: 'public',
	synchronize: false,
} as const;

export const DATABASE_POOL_CONFIG = {
	max: 20,
	min: 5,
	acquire: 30000,
	idle: 10000,
} as const;

export const REDIS_DEFAULTS = {
	db: 0,
	keyPrefix: 'everytriv:',
	enableReadyCheck: true,
	maxRetriesPerRequest: 3,
	enableOfflineQueue: true,
	connectTimeout: 10000,
	commandTimeout: 5000,
} as const;

export const REDIS_RETRY_STRATEGY_CONFIG = {
	delayMultiplier: 50,
	maxDelay: 2000,
	targetError: 'READONLY',
} as const;

export const ADMIN_CREDENTIALS_DEFAULTS = {
	email: 'admin@example.com',
	password: 'AdminPass123!',
	firstName: 'Admin',
	lastName: 'Tester',
} as const;
