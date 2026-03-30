import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import type { ViteProxyConfig } from '@shared/types';

import { APP_NAME, HttpMethod, LOCALHOST_CONFIG, TIME_PERIODS_MS } from '../shared/constants';

const HTML_APP_NAME_PLACEHOLDER = '__APP_NAME__';

export default defineConfig({
	plugins: [
		react(),
		{
			name: 'html-app-name',
			transformIndexHtml(html) {
				return html.replace(HTML_APP_NAME_PLACEHOLDER, APP_NAME);
			},
		},
	],
	build: {
		outDir: 'dist',
		emptyOutDir: true,
		rollupOptions: {
			external: id => {
				// Match Node core modules only by exact id — do NOT use id.includes('util')
				// or '@shared/utils' is treated as external (substring "util" inside "utils").
				const core = ['fs', 'path', 'util', 'stream'] as const;
				return core.some(m => id === m || id === `node:${m}`);
			},
		},
	},
	server: {
		port: LOCALHOST_CONFIG.ports.CLIENT,
		proxy: (() => {
			// API paths that should be proxied to the server (must match server API_ENDPOINTS bases).
			// /auth/callback is handled by React Router, not proxied.
			const proxyPaths = [
				'/auth',
				'/api',
				'/users',
				'/analytics',
				'/credits',
				'/payment',
				'/game',
				'/multiplayer',
				'/admin',
			];
			const proxyConfig: ViteProxyConfig = {
				target: LOCALHOST_CONFIG.urls.SERVER,
				changeOrigin: true,
				secure: false,
				bypass: req => {
					const isFrontendRequest = req.method === HttpMethod.GET && !req.headers?.accept?.includes('application/json');

					if (isFrontendRequest) {
						return false;
					}
					return null;
				},
			};
			const proxyMap: Record<string, ViteProxyConfig> = {};
			proxyPaths.forEach(path => {
				proxyMap[path] = proxyConfig;
			});
			return proxyMap;
		})(),
		// Add these settings to prevent extension communication issues
		hmr: {
			overlay: false, // Disable error overlay that can interfere with extensions
			port: 24678, // Use a specific port for HMR
			clientPort: 24678, // Ensure client connects to the right port
			timeout: TIME_PERIODS_MS.THIRTY_SECONDS, // Increase timeout to prevent connection issues
			protocol: 'ws', // Use WebSocket protocol
			host: 'localhost', // Use localhost for HMR
		},
		host: true, // Expose to network
		open: false, // Don't auto-open browser (prevents some extension conflicts)
	},
	// Handle SPA routing - serve index.html for all routes
	preview: {
		port: LOCALHOST_CONFIG.ports.CLIENT,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			src: path.resolve(__dirname, './src'),
			'@shared': path.resolve(__dirname, '../shared'),
		},
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
		'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || LOCALHOST_CONFIG.urls.SERVER),
		'process.env.VITE_APP_NAME': JSON.stringify(process.env.VITE_APP_NAME || APP_NAME),
	},
});
