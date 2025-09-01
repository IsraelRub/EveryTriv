import { HttpException, HttpStatus, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { RATE_LIMIT_DEFAULTS } from 'everytriv-shared/constants';
import { Redis } from 'ioredis';

import { LoggerService } from '../controllers';
import { NestNextFunction, NestRequest, NestResponse } from '../types';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
	private readonly WINDOW_SIZE_IN_SECONDS = RATE_LIMIT_DEFAULTS.WINDOW_MS / 1000;
	private readonly MAX_REQUESTS_PER_WINDOW = RATE_LIMIT_DEFAULTS.MAX_REQUESTS_PER_WINDOW;
	private readonly BURST_LIMIT = RATE_LIMIT_DEFAULTS.BURST_LIMIT;

	constructor(
		@Inject('REDIS_CLIENT') private readonly redis: Redis,
		private readonly logger: LoggerService
	) {}

	async use(req: NestRequest, res: NestResponse, next: NestNextFunction) {
		const ip = req.ip || req.connection.remoteAddress || 'unknown';
		const key = `ratelimit:${ip}:${req.path}`;
		const burstKey = `ratelimit:burst:${ip}`;

		// Special handling for client-logs endpoint
		const isClientLogs = req.path.startsWith('/client-logs');
		const maxRequests = isClientLogs ? RATE_LIMIT_DEFAULTS.CLIENT_LOGS_MAX_REQUESTS : this.MAX_REQUESTS_PER_WINDOW;
		const burstLimit = isClientLogs ? RATE_LIMIT_DEFAULTS.CLIENT_LOGS_BURST_LIMIT : this.BURST_LIMIT;

		try {
			// Check burst limit first (first second)
			const burstCount = await this.redis.incr(burstKey);
			if (burstCount === 1) {
				await this.redis.expire(burstKey, 60); // 1 minute burst window
			}

			if (burstCount > burstLimit) {
				this.logger.securityDenied('Burst rate limit exceeded', {
					ip,
					path: req.path,
					burstCount,
					limit: burstLimit,
				});

				throw new HttpException(
					{
						status: HttpStatus.TOO_MANY_REQUESTS,
						message: RATE_LIMIT_DEFAULTS.BURST_MESSAGE,
						retryAfter: RATE_LIMIT_DEFAULTS.BURST_WINDOW_MS / 1000,
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

				this.logger.securityDenied('Rate limit exceeded', {
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
						retryAfter: ttl,
					},
					HttpStatus.TOO_MANY_REQUESTS
				);
			}

			// Add rate limit headers
			res.header('X-RateLimit-Limit', maxRequests.toString());
			res.header('X-RateLimit-Remaining', Math.max(0, maxRequests - requests).toString());
			res.header('X-RateLimit-Reset', (Math.floor(Date.now() / 1000) + this.WINDOW_SIZE_IN_SECONDS).toString());

			// Log successful rate limit check
			this.logger.security('access', 'Rate limit check passed', {
				ip,
				path: req.path,
				requests,
				remaining: maxRequests - requests,
			});

			next();
		} catch (err) {
			if (err instanceof HttpException) {
				throw err;
			}

			this.logger.systemError('Rate limit middleware error', {
				error: err instanceof Error ? err.message : String(err),
				ip,
				path: req.path,
			});

			next(err);
		}
	}
}
