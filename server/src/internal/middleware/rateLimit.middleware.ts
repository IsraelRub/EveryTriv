import { HttpException, HttpStatus, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { Redis } from 'ioredis';

import { RATE_LIMIT_DEFAULTS, SERVER_CACHE_KEYS, TIME_DURATIONS_SECONDS, TIME_PERIODS_MS } from '@shared/constants';
import { calculateDuration, ensureErrorObject, getCurrentTimestampInSeconds } from '@shared/utils';

import { AppConfig } from '@config';
import { serverLogger as logger, metricsService } from '@internal/services';
import type { NestRequest } from '@internal/types';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
	private readonly WINDOW_SIZE_IN_SECONDS = RATE_LIMIT_DEFAULTS.WINDOW_MS / 1000;
	private readonly MAX_REQUESTS_PER_WINDOW = RATE_LIMIT_DEFAULTS.MAX_REQUESTS_PER_WINDOW;
	private readonly BURST_LIMIT = RATE_LIMIT_DEFAULTS.BURST_LIMIT;

	constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis | null) {}

	private isLocalhost(ip: string): boolean {
		if (!ip || ip === 'unknown') {
			return false;
		}
		const normalizedIp = ip.toLowerCase().trim();
		// Check for various localhost formats
		return (
			normalizedIp === '127.0.0.1' ||
			normalizedIp === '::1' ||
			normalizedIp === '::ffff:127.0.0.1' ||
			normalizedIp === 'localhost' ||
			normalizedIp.startsWith('127.') ||
			normalizedIp.startsWith('::ffff:127.') ||
			normalizedIp === '::' ||
			normalizedIp.startsWith('::ffff:') ||
			// Also check if it's undefined or empty (might happen in some cases)
			normalizedIp === ''
		);
	}

	async use(req: NestRequest, res: Response, next: NextFunction) {
		if (!AppConfig.features.rateLimitingEnabled) {
			return next();
		}

		const startTime = Date.now();
		// Try multiple ways to get the IP address
		const xForwardedFor = req.headers['x-forwarded-for'];
		const xRealIp = req.headers['x-real-ip'];
		const forwardedIp = typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0]?.trim() : undefined;
		const realIp = typeof xRealIp === 'string' ? xRealIp : undefined;
		const ip =
			req.ip ?? req.socket?.remoteAddress ?? req.connection?.remoteAddress ?? forwardedIp ?? realIp ?? 'unknown';

		// Bypass rate limiting for localhost (development/testing)
		// This allows local API tests to run without hitting rate limits
		// Production IPs will still be rate limited
		const shouldBypass =
			AppConfig.features.bypassRateLimitForLocalhost !== false &&
			(this.isLocalhost(ip) || AppConfig.nodeEnv === 'development' || process.env.NODE_ENV === 'development');

		if (shouldBypass) {
			logger.security('access', 'Rate limit bypassed for localhost/development', {
				ip,
				path: req.path,
				nodeEnv: AppConfig.nodeEnv,
			});
			const duration = calculateDuration(startTime);
			metricsService.trackMiddlewareExecution('RateLimitMiddleware', duration, true);
			return next();
		}

		if (!this.redis) {
			logger.systemError('Redis not available for rate limiting - skipping rate limit check');
			const duration = calculateDuration(startTime);
			metricsService.trackMiddlewareExecution('RateLimitMiddleware', duration, true);
			return next();
		}

		const key = SERVER_CACHE_KEYS.RATE_LIMIT.WINDOW(ip, req.path);
		const burstKey = SERVER_CACHE_KEYS.RATE_LIMIT.BURST(ip);

		const maxRequests = this.MAX_REQUESTS_PER_WINDOW;
		const burstLimit = this.BURST_LIMIT;

		try {
			const burstCount = await this.redis.incr(burstKey);
			if (burstCount === 1) {
				await this.redis.expire(burstKey, TIME_DURATIONS_SECONDS.THIRTY_SECONDS);
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
							windowMs: TIME_PERIODS_MS.MINUTE,
						},
						retryAfter: RATE_LIMIT_DEFAULTS.BURST_WINDOW_MS / 1000,
						timestamp: new Date().toISOString(),
					},
					HttpStatus.TOO_MANY_REQUESTS
				);
			}

			const requests = await this.redis.incr(key);

			if (requests === 1) {
				await this.redis.expire(key, this.WINDOW_SIZE_IN_SECONDS);
			}

			if (requests > maxRequests) {
				const ttl = await this.redis.ttl(key);

				logger.securityDenied('Rate limit exceeded', {
					ip,
					path: req.path,
					requestCounts: { current: requests },
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
						},
						retryAfter: ttl,
						timestamp: new Date().toISOString(),
					},
					HttpStatus.TOO_MANY_REQUESTS
				);
			}

			res.header('X-RateLimit-Limit', maxRequests.toString());
			res.header('X-RateLimit-Remaining', Math.max(0, maxRequests - requests).toString());
			res.header('X-RateLimit-Reset', (getCurrentTimestampInSeconds() + this.WINDOW_SIZE_IN_SECONDS).toString());

			logger.security('access', 'Rate limit check passed', {
				ip,
				path: req.path,
				requestCounts: { current: requests },
				remaining: maxRequests - requests,
			});

			const duration = calculateDuration(startTime);
			metricsService.trackMiddlewareExecution('RateLimitMiddleware', duration, true);

			next();
		} catch (err) {
			const duration = calculateDuration(startTime);
			const normalizedError = ensureErrorObject(err);
			metricsService.trackMiddlewareExecution('RateLimitMiddleware', duration, false, normalizedError);

			if (err instanceof HttpException) {
				throw err;
			}

			logger.systemError(normalizedError, {
				contextMessage: 'Rate limit middleware error',
				ip,
				path: req.path,
			});

			next();
		}
	}
}
