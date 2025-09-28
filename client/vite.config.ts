import react from '@vitejs/plugin-react';
import path from 'path';
import { DEFAULT_PORTS, DEFAULT_URLS } from '../shared/constants/infrastructure/infrastructure.constants';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';


export default defineConfig({
	plugins: [react()],
	build: {
		outDir: 'dist',
		emptyOutDir: true,
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
		proxy: {
			'/v1': {
				target: DEFAULT_URLS.DEV_SERVER,
				changeOrigin: true,
				secure: false,
			},
			'/auth': {
				target: DEFAULT_URLS.DEV_SERVER,
				changeOrigin: true,
				secure: false,
			},
			'/api': {
				target: DEFAULT_URLS.DEV_SERVER,
				changeOrigin: true,
				secure: false,
			},
			'/game': {
				target: DEFAULT_URLS.DEV_SERVER,
				changeOrigin: true,
				secure: false,
			},
			'/leaderboard': {
				target: DEFAULT_URLS.DEV_SERVER,
				changeOrigin: true,
				secure: false,
			},
			'/users': {
				target: DEFAULT_URLS.DEV_SERVER,
				changeOrigin: true,
				secure: false,
			},
			'/analytics': {
				target: DEFAULT_URLS.DEV_SERVER,
				changeOrigin: true,
				secure: false,
			},
			'/points': {
				target: DEFAULT_URLS.DEV_SERVER,
				changeOrigin: true,
				secure: false,
			},
			'/payment': {
				target: DEFAULT_URLS.DEV_SERVER,
				changeOrigin: true,
				secure: false,
			},
		},
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
		'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3003'),
		'process.env.VITE_APP_NAME': JSON.stringify(process.env.VITE_APP_NAME || 'EveryTriv'),
	},
});
