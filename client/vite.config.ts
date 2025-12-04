import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

import { DEFAULT_PORTS, DEFAULT_URLS, LOCALHOST_URLS } from '../shared/constants';
import type { ViteProxyConfig } from '../shared/types';


export default defineConfig({
	plugins: [react()],
	build: {
		outDir: 'dist',
		emptyOutDir: true,
		rollupOptions: {
			external: (id) => {
				const nodeModules = ['fs', 'path', 'util', 'stream'];
				return nodeModules.some(module => id.includes(module));
			},
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./test/setup.ts', './test/jest.setup.ts'],
		css: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				...configDefaults.coverage.exclude || [],
				'node_modules/',
				'dist/',
				'dist-temp/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/coverage/**',
				'**/test/**',
				'**/*.test.*',
				'**/*.spec.*',
			],
		},
		exclude: [
			...configDefaults.exclude || [],
			'**/node_modules/**',
			'**/dist/**',
			'**/dist-temp/**',
			'**/coverage/**',
		],
		environmentOptions: {
			jsdom: {
				resources: 'usable',
			},
		},
		testTimeout: 10000,
		hookTimeout: 10000,
		teardownTimeout: 10000,
	},
	server: {
		port: DEFAULT_PORTS.CLIENT,
		proxy: (() => {
			// API paths that should be proxied to the server
			// Note: /auth/callback is handled by React Router, not proxied
			const proxyPaths = ['/v1', '/api', '/leaderboard', '/users', '/analytics', '/credits', '/payment'];
			const proxyConfig: ViteProxyConfig = {
				target: DEFAULT_URLS.DEV_SERVER,
				changeOrigin: true,
				secure: false,
				// Generic bypass logic: identify frontend requests vs API requests
				// Frontend requests: GET requests without Accept: application/json header
				// API requests: POST/PUT/DELETE or requests with Accept: application/json header
				bypass: (req) => {
					const isFrontendRequest =
						req.method === 'GET' && !req.headers?.accept?.includes('application/json');

					if (isFrontendRequest) {
						// Let Vite handle it (SPA routing) - React Router will handle 404
						return false;
					}
					// Proxy to server (API request)
					return null;
				},
			};
			const proxyMap: Record<string, ViteProxyConfig> = {};

			// Add all API paths with the generic bypass logic
			proxyPaths.forEach(path => {
				proxyMap[path] = proxyConfig;
			});

			// Add specific auth endpoints (excluding /auth/callback which is handled by React Router)
			proxyMap['/auth/google'] = proxyConfig;
			proxyMap['/auth/google/callback'] = proxyConfig;
			proxyMap['/auth/login'] = proxyConfig;
			proxyMap['/auth/register'] = proxyConfig;
			proxyMap['/auth/logout'] = proxyConfig;
			proxyMap['/auth/refresh'] = proxyConfig;

			return proxyMap;
		})(),
		// Add these settings to prevent extension communication issues
		hmr: {
			overlay: false, // Disable error overlay that can interfere with extensions
			port: 24678, // Use a specific port for HMR
			clientPort: 24678, // Ensure client connects to the right port
			timeout: 30000, // Increase timeout to prevent connection issues
			protocol: 'ws', // Use WebSocket protocol
			host: 'localhost', // Use localhost for HMR
		},
		host: true, // Expose to network
		open: false, // Don't auto-open browser (prevents some extension conflicts)
	},
	// Handle SPA routing - serve index.html for all routes
	preview: {
		port: 5173,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'), // This maps @/* to ./src/*
			src: path.resolve(__dirname, './src'), // This maps src/* to ./src/*
			'@shared': path.resolve(__dirname, '../shared'), // This maps @shared to ../shared
			'@shared/*': path.resolve(__dirname, '../shared/*'), // This maps @shared/* to ../shared/*
			'@test': path.resolve(__dirname, './test'), // This maps @test/* to ./test/*
		},
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
		'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || LOCALHOST_URLS.SERVER),
		'process.env.VITE_APP_NAME': JSON.stringify(process.env.VITE_APP_NAME || 'EveryTriv'),
	},
});
