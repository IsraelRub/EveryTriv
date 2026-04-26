import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { VITE_API_BUNDLE_USE_ORIGIN_PREFIX } from '../shared/constants/core/api.constants';
import { APP_NAME } from '../shared/constants/core/app.constants';
import { TIME_PERIODS_MS } from '../shared/constants/core/time.constants';
import { HttpMethod } from '../shared/constants/infrastructure/http.constants';
import { LOCALHOST_CONFIG } from '../shared/constants/infrastructure/localhost.constants';
import type { ViteProxyConfig } from './src/types/infrastructure/viteProxy.types';

const HTML_APP_NAME_PLACEHOLDER = '__APP_NAME__';

export default defineConfig(({ mode }) => {
	const rawViteApi = process.env.VITE_API_BASE_URL;
	const bakedViteApi =
		rawViteApi === VITE_API_BUNDLE_USE_ORIGIN_PREFIX
			? VITE_API_BUNDLE_USE_ORIGIN_PREFIX
			: rawViteApi != null && rawViteApi !== ''
				? rawViteApi
				: LOCALHOST_CONFIG.urls.SERVER;
	const nodeEnvForBundle =
		(process.env.NODE_ENV ?? '').trim() !== '' ? process.env.NODE_ENV : mode === 'dev' ? 'dev' : 'prod';

	return {
		envDir: path.resolve(__dirname, '..'),
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
					const core = ['fs', 'path', 'util', 'stream'] as const;
					return core.some(m => id === m || id === `node:${m}`);
				},
			},
		},
		server: {
			port: LOCALHOST_CONFIG.ports.CLIENT,
			proxy: (() => {
				const apiPrefixProxy: ViteProxyConfig = {
					target: LOCALHOST_CONFIG.urls.SERVER,
					changeOrigin: true,
					secure: false,
					rewrite: (reqPath: string) => (reqPath.startsWith('/api/health') ? reqPath : reqPath.replace(/^\/api/, '')),
				};
				const proxyPaths = ['/auth', '/users', '/analytics', '/credits', '/payment', '/game', '/multiplayer', '/admin'];
				const proxyConfig: ViteProxyConfig = {
					target: LOCALHOST_CONFIG.urls.SERVER,
					changeOrigin: true,
					secure: false,
					bypass: req => {
						const pathname = req.url?.split('?')[0] ?? '';
						if (pathname === '/auth/callback') {
							return '/index.html';
						}

						const isFrontendRequest = req.method === HttpMethod.GET && !req.headers?.accept?.includes('application/json');

						if (isFrontendRequest) {
							return false;
						}
						return null;
					},
				};
				const socketIoProxy: ViteProxyConfig = {
					target: LOCALHOST_CONFIG.urls.SERVER,
					changeOrigin: true,
					secure: false,
					ws: true,
				};
				const proxyMap: Record<string, ViteProxyConfig> = {
					'/api': apiPrefixProxy,
					'/socket.io': socketIoProxy,
				};
				proxyPaths.forEach(p => {
					proxyMap[p] = proxyConfig;
				});
				return proxyMap;
			})(),
			hmr: {
				overlay: false,
				port: 24678,
				clientPort: 24678,
				timeout: TIME_PERIODS_MS.THIRTY_SECONDS,
				protocol: 'ws',
				host: 'localhost',
			},
			host: true,
			open: false,
		},
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
			'process.env.NODE_ENV': JSON.stringify(nodeEnvForBundle),
			'process.env.VITE_API_BASE_URL': JSON.stringify(bakedViteApi),
			'process.env.VITE_APP_NAME': JSON.stringify(process.env.VITE_APP_NAME || APP_NAME),
		},
	};
});
