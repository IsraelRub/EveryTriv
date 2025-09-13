/**
 * Configuration Types Exports
 * @module ConfigTypesExports
 * @description Configuration type exports for server use
 */

/**
 * Configuration types
 * @description Application configuration, database, JWT, and rate limiting types
 * @exports {Object} Configuration-related type definitions
 */
export type { RateLimitConfig } from '../nest.types';
export type { AppConfigInterface, DatabaseConfigType, JwtConfig } from '@shared';
export type { RedisConfig } from '@shared';

/**
 * NestJS types
 * @description NestJS framework specific types and interfaces
 * @exports {Object} NestJS-related type definitions
 */
export type { NestNextFunction, NestRequest, NestResponse, RequestContext } from '../nest.types';
