export const LOCALHOST_CONFIG = {
	urls: {
		/** API server — aligned with Docker Compose published port (server: 3002:3002) */
		SERVER: 'http://localhost:3002',
		/** Vite dev server (`pnpm` client dev) */
		CLIENT: 'http://localhost:5173',
		/** Built SPA served by nginx in Docker Compose (client: 3000:3000) */
		CLIENT_DOCKER: 'http://localhost:3000',
	},
	ports: {
		SERVER: 3002,
		CLIENT: 5173,
		CLIENT_DOCKER: 3000,
		DATABASE: 5432,
		REDIS: 6379,
	},
	hosts: {
		DATABASE: 'localhost',
		REDIS: 'localhost',
		DOMAIN: 'localhost',
	},
} as const;

/** Browser origins for local stacks (CORS, Socket.IO, OAuth base URL checks) */
export const LOCALHOST_CLIENT_ORIGINS: readonly string[] = [
	LOCALHOST_CONFIG.urls.CLIENT,
	LOCALHOST_CONFIG.urls.CLIENT_DOCKER,
];

export function isLocalhostClientOrigin(origin: string): boolean {
	return LOCALHOST_CLIENT_ORIGINS.includes(origin);
}
