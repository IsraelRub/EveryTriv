export interface ViteProxyConfig {
	target: string;
	changeOrigin: boolean;
	secure: boolean;
	bypass?: (req: { url?: string; method?: string; headers?: { accept?: string } }) => string | false | null | undefined;
	configure?: (proxy: unknown, options: unknown) => void;
}
