export const ENV_VAR_NAMES = {
	API_BASE_URL: 'VITE_API_BASE_URL', // Unified name for API URL
	CLIENT_URL: 'VITE_CLIENT_URL',
	SERVER_URL: 'VITE_SERVER_URL',
	DATABASE_HOST: 'DATABASE_HOST',
	DATABASE_PORT: 'DATABASE_PORT',
	REDIS_HOST: 'REDIS_HOST',
	REDIS_PORT: 'REDIS_PORT',
	CORS_ORIGIN: 'CORS_ORIGIN',
} as const;

export const LOCALHOST_CONFIG = {
	urls: {
		SERVER: 'http://localhost:3001',
		CLIENT: 'http://localhost:5173',
	},
	ports: {
		SERVER: 3001,
		CLIENT: 5173,
		DATABASE: 5432,
		REDIS: 6379,
	},
	hosts: {
		DATABASE: 'localhost',
		REDIS: 'localhost',
		DOMAIN: 'localhost',
	},
} as const;
