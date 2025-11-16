import { Request, Response } from 'express';

import type { UserRole } from '@shared/constants';

/**
 * NestJS types
 * @description NestJS types used across the server
 * @exports {Object} Nest types
 */

export interface CacheConfig {
	ttl: number;
	key?: string;
	tags?: string[];
	disabled?: boolean;
	condition?: (request: NestRequest, response: Response) => boolean;
}

/**
 * Bulk operation metadata interface
 * @interface BulkMetadata
 * @description Metadata for bulk operations and batch processing
 */
export interface BulkMetadata {
	isBulk: boolean;
	batchSize?: number;
	operationType?: string;
	optimization?: 'none' | 'basic' | 'aggressive';
}

// NestJS request/response types
export interface NestRequest extends Request {
	authToken?: string;
	userRole?: UserRole;
	user?: UserPayload;
	decoratorMetadata?: DecoratorMetadata;
	bulkMetadata?: BulkMetadata;
	timestamp?: Date;
	requestId?: string;
}

// Decorator metadata types
export interface DecoratorMetadata {
	isPublic: boolean;
	requireAuth: boolean;
	roles: string[];
	permissions: string[];
	rateLimit: RateLimitConfig | null;
	cache: CacheConfig | null;
	cacheTags: string[];
	apiResponse?: ApiResponseConfig;
	apiResponses?: ApiResponseConfig[];
	validationSchema?: string | object;
	customValidation?: (value: unknown) => boolean;
}

export interface RateLimitConfig {
	limit: number;
	window: number;
}

export interface ApiResponseConfig {
	status: number;
	description?: string;
}

// User payload types
export interface UserPayload {
	sub: string;
	username: string;
	email: string;
	role: UserRole;
	iat: number;
	exp: number;
}
