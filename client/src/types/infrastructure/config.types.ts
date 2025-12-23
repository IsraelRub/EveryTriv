/**
 * Client Configuration Types
 * @module ClientConfigTypes
 * @description Client-side configuration type definitions
 */

/**
 * Vite Proxy Configuration interface
 * @interface ViteProxyConfig
 * @description Configuration for Vite development server proxy
 * @used_by client/vite.config.ts
 */
export interface ViteProxyConfig {
	target: string;
	changeOrigin: boolean;
	secure: boolean;
	bypass?: (req: { url?: string; method?: string; headers?: { accept?: string } }) => string | false | null | undefined;
	configure?: (proxy: unknown, options: unknown) => void;
}
