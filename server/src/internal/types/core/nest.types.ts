import { Request, Response } from 'express';

import type { UserRole } from '@shared/constants';

import { OptimizationLevel as OptimizationLevelEnum } from '@internal/constants';

export interface CacheConfig {
	ttl: number;
	key?: string;
	tags?: string[];
	disabled?: boolean;
	condition?: (request: NestRequest, response: Response) => boolean;
}

export interface BulkMetadata {
	isBulk: boolean;
	batchSize?: number;
	operationType?: string;
	optimization?: (typeof OptimizationLevelEnum)[keyof typeof OptimizationLevelEnum];
}

export interface NestRequest extends Request {
	authToken?: string;
	userRole?: UserRole;
	user?: UserPayload;
	bulkMetadata?: BulkMetadata;
	timestamp?: Date;
	requestId?: string;
}

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

export interface UserPayload {
	sub: string;
	email: string;
	role: UserRole;
	iat: number;
	exp: number;
}
