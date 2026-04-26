export const LOCALHOST_CONFIG = {
	urls: {
		SERVER: 'http://localhost:3001',
		CLIENT: 'http://localhost:5173',
		CLIENT_DOCKER: 'http://localhost:3000',
	},
	ports: {
		SERVER: 3001,
		CLIENT: 5173,
		CLIENT_DOCKER: 3000,
		DATABASE: 5432,

		REDIS: 6380,
	},
	hosts: {
		DATABASE: 'localhost',
		REDIS: 'localhost',
		DOMAIN: 'localhost',
	},
} as const;

export const LOCALHOST_CLIENT_ORIGINS: readonly string[] = [
	LOCALHOST_CONFIG.urls.CLIENT,
	LOCALHOST_CONFIG.urls.CLIENT_DOCKER,
];

export function isLocalhostClientOrigin(origin: string): boolean {
	return LOCALHOST_CLIENT_ORIGINS.includes(origin);
}
