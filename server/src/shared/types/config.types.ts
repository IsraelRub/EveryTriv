/**
 * Configuration types for the server
 */

export interface DatabaseConfig {
	host: string;
	port: number;
	username: string;
	password: string;
	database: string;
	schema: string;
}

// Re-export from redis.types to avoid duplication
export type { RedisConfig } from './redis.types';

export interface JwtConfig {
	secret: string;
	expiresIn: string;
	refreshExpiresIn: string;
}

export interface RateLimitConfig {
	windowMs: number;
	max: number;
}

export interface AppConfig {
	port: number;
	nodeEnv: string;
	apiVersion: string;
	domain: string;
	corsOrigin: string;
	cookieSecret: string;
}
