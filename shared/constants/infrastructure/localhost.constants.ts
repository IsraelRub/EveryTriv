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
