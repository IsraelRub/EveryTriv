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

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  ttl: number;
}

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
