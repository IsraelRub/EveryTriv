/**
 * Configuration Types
 * @module ConfigTypes
 * @description Application configuration related types
 */

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

// Redis Configuration - imported from redis.types.ts
export type { RedisConfig } from './redis.types';

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
}
