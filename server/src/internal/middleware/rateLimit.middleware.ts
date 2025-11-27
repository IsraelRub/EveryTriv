import { HttpException, HttpStatus, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { Redis } from 'ioredis';

import { CACHE_DURATION, RATE_LIMIT_DEFAULTS } from '@shared/constants';
import { serverLogger as logger, metricsService } from '@shared/services';
import { ensureErrorObject } from '@shared/utils';

import { AppConfig } from '../../config/app.config';
import { NestRequest } from '../types';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
	private readonly WINDOW_SIZE_IN_SECONDS = RATE_LIMIT_DEFAULTS.WINDOW_MS / 1000;
	private readonly MAX_REQUESTS_PER_WINDOW = RATE_LIMIT_DEFAULTS.MAX_REQUESTS_PER_WINDOW;
	private readonly BURST_LIMIT = RATE_LIMIT_DEFAULTS.BURST_LIMIT;

	constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis | null) {}

	async use(req: NestRequest, res: Response, next: NextFunction) {
		if (!AppConfig.features.rateLimitingEnabled) {
			next();
			return;
		}

		const startTime = Date.now();
		const ip = req.ip || req.connection?.remoteAddress || 'unknown';

		// Skip rate limiting if Redis is not available
		if (!this.redis) {
			logger.systemError('Redis not available for rate limiting - skipping rate limit check');
			return next();
		}

		// Check for decorator-based rate limiting first
		const decoratorRateLimit = req.decoratorMetadata?.rateLimit;

		if (decoratorRateLimit) {
			// Use decorator-based rate limiting
			const { limit, window } = decoratorRateLimit;
			const key = `decorator_ratelimit:${ip}:${req.path}:${limit}:${window}`;

			try {
				// Check current request count
				const requests = await this.redis.incr(key);

				// Set expiration on first request
				if (requests === 1) {
					await this.redis.expire(key, window);
				}

				// Check if limit exceeded
				if (requests > limit) {
					const ttl = await this.redis.ttl(key);

					logger.securityDenied('Decorator rate limit exceeded', {
						ip,
						path: req.path,
						requests,
						limit,
						window,
						ttl,
					});

					throw new HttpException(
						{
							status: HttpStatus.TOO_MANY_REQUESTS,
							message: `Rate limit exceeded. Maximum ${limit} requests per ${window} seconds.`,
							details: {
								currentRequests: requests,
								limit,
								windowSeconds: window,
								remainingTime: ttl,
								endpoint: req.path,
								method: req.method,
								ip: ip,
							},
							retryAfter: ttl,
							timestamp: new Date().toISOString(),
						},
						HttpStatus.TOO_MANY_REQUESTS
					);
				}

				// Add rate limit headers
				res.header('X-RateLimit-Limit', limit.toString());
				res.header('X-RateLimit-Remaining', Math.max(0, limit - requests).toString());
				res.header('X-RateLimit-Reset', (Math.floor(Date.now() / 1000) + window).toString());

				// Log successful rate limit check
				logger.security('access', 'Decorator rate limit check passed', {
					ip,
					path: req.path,
					requests,
					limit,
					window,
					remaining: limit - requests,
				});

				// Record metrics
				const duration = Date.now() - startTime;
				metricsService.trackMiddlewareExecution('RateLimitMiddleware', duration, true);

				next();
				return;
			} catch (err) {
				// Record error metrics
				const duration = Date.now() - startTime;
				const normalizedError = ensureErrorObject(err);
				metricsService.trackMiddlewareExecution('RateLimitMiddleware', duration, false, normalizedError);

				if (err instanceof HttpException) {
					throw err;
				}

				logger.systemError(normalizedError, 'Decorator rate limit middleware error', {
					ip,
					path: req.path,
				});

				// Don't pass errors to next() in middleware
				next();
				return;
			}
		}

		// Fall back to default rate limiting
		const key = `ratelimit:${ip}:${req.path}`;
		const burstKey = `ratelimit:burst:${ip}`;

		// Special handling for client-logs endpoint
		const isClientLogs = req.path?.startsWith('/client-logs') || false;
		const maxRequests = isClientLogs ? RATE_LIMIT_DEFAULTS.CLIENT_LOGS_MAX_REQUESTS : this.MAX_REQUESTS_PER_WINDOW;
		const burstLimit = isClientLogs ? RATE_LIMIT_DEFAULTS.CLIENT_LOGS_BURST_LIMIT : this.BURST_LIMIT;

		try {
			// Check burst limit first (first second)
			const burstCount = await this.redis.incr(burstKey);
			if (burstCount === 1) {
				await this.redis.expire(burstKey, CACHE_DURATION.VERY_SHORT); // 1 minute burst window
			}

			if (burstCount > burstLimit) {
				logger.securityDenied('Burst rate limit exceeded', {
					ip,
					path: req.path,
					burstCount,
					limit: burstLimit,
				});

				throw new HttpException(
					{
						status: HttpStatus.TOO_MANY_REQUESTS,
						message: RATE_LIMIT_DEFAULTS.BURST_MESSAGE,
						details: {
							type: 'burst_limit',
							currentBurst: burstCount,
							burstLimit,
							endpoint: req.path,
							method: req.method,
							ip: ip,
							windowMs: 60000, // 1 minute burst window
						},
						retryAfter: RATE_LIMIT_DEFAULTS.BURST_WINDOW_MS / 1000,
						timestamp: new Date().toISOString(),
					},
					HttpStatus.TOO_MANY_REQUESTS
				);
			}

			// Check window-based rate limit
			const requests = await this.redis.incr(key);

			if (requests === 1) {
				await this.redis.expire(key, this.WINDOW_SIZE_IN_SECONDS);
			}

			if (requests > maxRequests) {
				const ttl = await this.redis.ttl(key);

				logger.securityDenied('Rate limit exceeded', {
					ip,
					path: req.path,
					requests,
					limit: maxRequests,
					ttl,
				});

				throw new HttpException(
					{
						status: HttpStatus.TOO_MANY_REQUESTS,
						message: RATE_LIMIT_DEFAULTS.MESSAGE,
						details: {
							type: 'window_limit',
							currentRequests: requests,
							maxRequests: maxRequests,
							windowSeconds: this.WINDOW_SIZE_IN_SECONDS,
							remainingTime: ttl,
							endpoint: req.path,
							method: req.method,
							ip: ip,
							isClientLogs,
						},
						retryAfter: ttl,
						timestamp: new Date().toISOString(),
					},
					HttpStatus.TOO_MANY_REQUESTS
				);
			}

			// Add rate limit headers
			res.header('X-RateLimit-Limit', maxRequests.toString());
			res.header('X-RateLimit-Remaining', Math.max(0, maxRequests - requests).toString());
			res.header('X-RateLimit-Reset', (Math.floor(Date.now() / 1000) + this.WINDOW_SIZE_IN_SECONDS).toString());

			// Log successful rate limit check
			logger.security('access', 'Rate limit check passed', {
				ip,
				path: req.path,
				requests,
				remaining: maxRequests - requests,
			});

			// Record metrics
			const duration = Date.now() - startTime;
			metricsService.trackMiddlewareExecution('RateLimitMiddleware', duration, true);

			next();
		} catch (err) {
			// Record error metrics
			const duration = Date.now() - startTime;
			const normalizedError = ensureErrorObject(err);
			metricsService.trackMiddlewareExecution('RateLimitMiddleware', duration, false, normalizedError);

			if (err instanceof HttpException) {
				throw err;
			}

			logger.systemError(normalizedError, 'Rate limit middleware error', {
				ip,
				path: req.path,
			});

			// Don't pass errors to next() in middleware
			next();
		}
	}
}
