/**
 * Configuration Types
 * @module ConfigTypes
 * @description Application configuration related types
 */

import type { PayPalEnvironment } from '@shared/constants';

// Database Configuration
export interface DatabaseConfigType {
	host: string;
	port: number;
	username: string;
	password: string;
	name: string;
	schema: string;
	synchronize: boolean;
	logging: boolean;
	ssl: boolean;
	pool: {
		max: number;
		min: number;
		acquire: number;
		idle: number;
	};
}

// JWT Configuration
export interface JwtConfig {
	secret: string;
	expiresIn: string;
	refreshExpiresIn: string;
}

// PayPal configuration
export interface PayPalConfig {
	clientId: string;
	clientSecret: string;
	merchantId: string;
	environment: PayPalEnvironment;
}

// Redis Configuration - imported from redis.types.ts
export type { RedisConfig } from './redis.types';

// Vite Proxy Configuration
export interface ViteProxyConfig {
	target: string;
	changeOrigin: boolean;
	secure: boolean;
	bypass?: (req: { url?: string; method?: string; headers?: { accept?: string } }) => string | false | null | undefined;
	configure?: (proxy: unknown, options: unknown) => void;
}

// Application Configuration Interface
export interface AppConfigInterface {
	port: number;
	nodeEnv: string;
	apiVersion: string;
	domain: string;
	corsOrigin: string;
	cookieSecret: string;
	apiUrl: {
		users: string;
		files: string;
	};
	database: DatabaseConfigType;
	redis: {
		host: string;
		port: number;
		password?: string;
		db?: number;
	};
	paypal: PayPalConfig;
}
