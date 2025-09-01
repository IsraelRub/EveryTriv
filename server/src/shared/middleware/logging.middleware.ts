import { Injectable, NestMiddleware } from '@nestjs/common';
import { MESSAGE_FORMATTERS, PERFORMANCE_THRESHOLDS } from 'everytriv-shared/constants/logging.constants';

import { LoggerService } from '../controllers';
import { NestNextFunction, NestRequest, NestResponse } from '../types';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
	private readonly SLOW_REQUEST_THRESHOLD = PERFORMANCE_THRESHOLDS.SLOW; // 1 second

	constructor(private readonly logger: LoggerService) {}

	use(req: NestRequest, res: NestResponse, next: NestNextFunction): void {
		const startTime = Date.now();

		// Log request start
		this.logger.apiInfo(MESSAGE_FORMATTERS.http.success('Request started'), {
			method: req.method,
			url: req.originalUrl,
			ip: req.ip || 'unknown',
			userAgent: req.get('user-agent')?.substring(0, 100) || 'unknown',
			context: 'LoggingMiddleware',
		});

		res.on('finish', () => {
			const duration = Date.now() - startTime;

			// Log request completion
			this.logger.httpSuccess(MESSAGE_FORMATTERS.http.success('Request completed'), {
				method: req.method,
				url: req.originalUrl,
				statusCode: res.statusCode,
				duration,
				ip: req.ip || 'unknown',
				userAgent: req.get('user-agent')?.substring(0, 100) || 'unknown',
				context: 'LoggingMiddleware',
			});

			// Log slow requests
			if (duration > this.SLOW_REQUEST_THRESHOLD) {
				this.logger.performance('request.slow', duration, {
					method: req.method,
					url: req.originalUrl,
					threshold: this.SLOW_REQUEST_THRESHOLD,
					context: 'LoggingMiddleware',
				});
			}

			// Log performance metrics
			this.logger.performance('request.duration', duration, {
				method: req.method,
				url: req.originalUrl,
				statusCode: res.statusCode,
				context: 'LoggingMiddleware',
			});
		});

		next();
	}
}
