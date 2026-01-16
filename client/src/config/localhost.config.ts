export const LOCALHOST_CONFIG = {
	urls: {
		SERVER: 'http://localhost:3001',
		CLIENT: 'http://localhost:5173',
		// Admin URLs
		PGADMIN_URL: 'http://localhost:8080',
		REDIS_COMMANDER_URL: 'http://localhost:8081',
		WEBDB_URL: 'http://localhost:22071',
	},
	ports: {
		SERVER: 3001,
		CLIENT: 5173,
		DATABASE: 5432,
		REDIS: 6379,
		PGADMIN: 8080,
		REDIS_COMMANDER: 8081,
		WEBDB: 22071,
	},
	hosts: {
		DATABASE: 'localhost',
		REDIS: 'localhost',
		DOMAIN: 'localhost',
	},
} as const;
