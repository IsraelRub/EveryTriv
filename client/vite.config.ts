import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
	server: {
		proxy: {
			'/v1': {
				target: 'http://localhost:3001',
				changeOrigin: true,
				secure: false,
			},
		},
		// Add these settings to prevent extension communication issues
		hmr: {
			overlay: false, // Disable error overlay that can interfere with extensions
		},
		host: true, // Expose to network
		open: false, // Don't auto-open browser (prevents some extension conflicts)
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'), // This maps @/* to ./src/*
		},
	},
});
