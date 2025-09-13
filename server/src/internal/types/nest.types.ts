import type { UserRole } from '@shared';
import { NextFunction, Request, Response } from 'express';

import type { BulkMetadata } from './metadata.types';

/**
 * NestJS-specific types for the server
 */

// NestJS request/response types
export type NestRequest = Request & {
	authToken?: string;
	country?: string;
	userRole?: UserRole;
	user?: UserPayload;
	decoratorMetadata?: DecoratorMetadata;
	bulkMetadata?: BulkMetadata;
	timestamp?: Date;
	requestId?: string;
};
export type NestResponse = Response;
export type NestNextFunction = NextFunction;

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
	keyGenerator?: (request: NestRequest) => string;
	skipSuccessfulRequests?: boolean;
	skipFailedRequests?: boolean;
	message?: string;
	statusCode?: number;
}

export interface CacheConfig {
	ttl: number;
	key?: string;
	tags?: string[];
	invalidateOn?: string[];
	disabled?: boolean;
	condition?: (request: NestRequest, response: NestResponse) => boolean;
}

export interface ApiResponseConfig {
	status: number;
	description: string;
	example?: unknown;
	schema?: Record<string, unknown>;
	headers?: Record<string, string>;
}

// User payload types
export interface UserPayload extends Record<string, unknown> {
	sub: string;
	username: string;
	email: string;
	role: UserRole;
	iat: number;
	exp: number;
}

// Request context interface (simplified)
export interface RequestContext {
	requestId: string;
	userId?: string;
	timestamp: Date;
	ipAddress: string;
	userAgent: string;
	method: string;
	url: string;
}

// Re-export metadata types from shared
export type { BulkMetadata, CacheMetadata } from './metadata.types';
