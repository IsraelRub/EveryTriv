import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Define constants locally for vite config
const DEFAULT_PORTS = {
	CLIENT: 3000,
	SERVER: 3002,
} as const;

const DEFAULT_URLS = {
	DEV_SERVER: 'http://localhost:3002',
} as const;

export default defineConfig({
	plugins: [react()],
	build: {
		outDir: 'dist',
		emptyOutDir: true,
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
		},
	},
});
