/**
 * Decorator-Aware Middleware
 *
 * @module DecoratorAwareMiddleware
 * @description Smart middleware that analyzes request patterns and prepares metadata structure
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { NextFunction, Response } from 'express';

import { CACHE_DURATION, HttpMethod, UserRole } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';
import type { NestRequest } from '@internal/types';

/**
 * Smart decorator-aware middleware that analyzes request patterns
 * and prepares metadata structure for other middleware
 */
@Injectable()
export class DecoratorAwareMiddleware implements NestMiddleware {
	constructor(private readonly reflector: Reflector) {}

	use(req: NestRequest, _res: Response, next: NextFunction) {
		const startTime = Date.now();

		try {
			// Analyze request pattern for smart defaults
			const requestAnalysis = this.analyzeRequest(req);

			// Read decorator metadata from the handler (if available)
			const decoratorMetadata = this.readDecoratorMetadata(req);

			// Initialize decorator metadata with decorator values taking precedence over smart defaults
			req.decoratorMetadata = {
				isPublic: decoratorMetadata.isPublic ?? requestAnalysis.isLikelyPublic,
				requireAuth: decoratorMetadata.requireAuth ?? !requestAnalysis.isLikelyPublic,
				roles: decoratorMetadata.roles.length > 0 ? decoratorMetadata.roles : requestAnalysis.requiredRoles,
				permissions: decoratorMetadata.permissions ?? [],
				rateLimit: decoratorMetadata.rateLimit ?? requestAnalysis.suggestedRateLimit,
				cache: decoratorMetadata.cache ?? requestAnalysis.suggestedCache,
				cacheTags: decoratorMetadata.cacheTags ?? [],
				apiResponse: decoratorMetadata.apiResponse || undefined,
				apiResponses: decoratorMetadata.apiResponses || undefined,
				validationSchema: decoratorMetadata.validationSchema || undefined,
				customValidation: decoratorMetadata.customValidation || undefined,
			};

			// Log middleware performance
			const duration = Date.now() - startTime;
			logger.performance('middleware.decorator-aware', duration, {
				path: req.path,
				method: req.method,
				analysis: JSON.stringify(requestAnalysis),
			});

			next();
		} catch (error) {
			logger.systemError('DecoratorAwareMiddleware error', {
				error: getErrorMessage(error),
				path: req.path,
				method: req.method,
			});

			// Fallback to safe defaults
			req.decoratorMetadata = {
				isPublic: false,
				requireAuth: true,
				roles: [],
				permissions: [],
				rateLimit: null,
				cache: null,
				cacheTags: [],
				apiResponse: undefined,
				apiResponses: undefined,
				validationSchema: undefined,
				customValidation: undefined,
			};

			next();
		}
	}

	/**
	 * Read decorator metadata from the handler
	 */
	private readDecoratorMetadata(req: NestRequest) {
		// Try to get handler from request context
		const handler = req.route?.stack?.[0]?.handle;

		if (!handler) {
			return {
				isPublic: undefined,
				requireAuth: undefined,
				roles: [],
				permissions: [],
				rateLimit: undefined,
				cache: undefined,
				cacheTags: [],
				apiResponse: undefined,
				apiResponses: undefined,
				validationSchema: undefined,
				customValidation: undefined,
			};
		}

		// Read decorator metadata from the handler
		const isPublic = this.reflector.get<boolean>('isPublic', handler);
		const requireAuth = this.reflector.get<boolean>('requireAuth', handler);
		const roles = this.reflector.get<string[]>('roles', handler);
		const permissions = this.reflector.get<string[]>('permissions', handler);
		const rateLimit = this.reflector.get<{ limit: number; window: number }>('rateLimit', handler);
		const cache = this.reflector.get<{ ttl: number; key?: string; disabled?: boolean }>('cache', handler);
		const cacheTags = this.reflector.get<string[]>('cacheTags', handler);
		const apiResponse = this.reflector.get<{ status: number; description: string }>('apiResponse', handler);
		const apiResponses = this.reflector.get<{ status: number; description: string }[]>('apiResponses', handler);
		const validationSchema = this.reflector.get<string | object>('validationSchema', handler);
		const customValidation = this.reflector.get<(value: unknown) => boolean>('customValidation', handler);

		return {
			isPublic: isPublic || false,
			requireAuth: requireAuth || false,
			roles: roles ?? [],
			permissions: permissions ?? [],
			rateLimit: rateLimit ?? null,
			cache: cache ?? null,
			cacheTags: cacheTags ?? [],
			apiResponse: apiResponse || undefined,
			apiResponses: apiResponses || undefined,
			validationSchema: validationSchema || undefined,
			customValidation: customValidation || undefined,
		};
	}

	/**
	 * Analyze request to provide smart defaults
	 */
	private analyzeRequest(req: NestRequest) {
		const path = req.path || '';
		const method = req.method || HttpMethod.GET;

		// Smart public endpoint detection
		const publicPatterns = [
			'/health',
			'/status',
			'/ping',
			'/version',
			'/auth/register',
			'/auth/login',
			'/auth/refresh',
			'/public',
			'/docs',
			'/swagger',
		];
		const isLikelyPublic = publicPatterns.some(pattern => path.includes(pattern));

		// Smart role detection based on path
		let requiredRoles: string[] = [];
		if (path.includes('/admin')) {
			requiredRoles = [UserRole.ADMIN];
		} else if (path.includes('/user') || path.includes('/profile')) {
			requiredRoles = [UserRole.USER, UserRole.ADMIN];
		}

		// Smart rate limiting suggestions
		let suggestedRateLimit: { limit: number; window: number } | null = null;
		if (path.includes('/auth/login')) {
			suggestedRateLimit = { limit: 5, window: 60 }; // 5 per minute for login
		} else if (path.includes('/auth/register')) {
			suggestedRateLimit = { limit: 3, window: 300 }; // 3 per 5 minutes for register
		} else if (method === HttpMethod.GET && !path.includes('/admin')) {
			suggestedRateLimit = { limit: 100, window: 60 }; // 100 per minute for GET requests
		}

		// Smart cache suggestions
		let suggestedCache: { ttl: number; key?: string } | null = null;
		if (method === HttpMethod.GET && !path.includes('/auth') && !path.includes('/admin')) {
			suggestedCache = { ttl: CACHE_DURATION.MEDIUM }; // 5 minutes cache for GET requests
		}

		return {
			isLikelyPublic,
			requiredRoles,
			suggestedRateLimit,
			suggestedCache,
		};
	}
}
