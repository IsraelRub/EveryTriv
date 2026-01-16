import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { PERFORMANCE_THRESHOLDS } from '@shared/constants';
import { calculateDuration, getErrorMessage } from '@shared/utils';

import { serverLogger as logger, metricsService } from '@internal/services';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
	private readonly SLOW_REQUEST_THRESHOLD = PERFORMANCE_THRESHOLDS.SLOW;
	private readonly CRITICAL_REQUEST_THRESHOLD = PERFORMANCE_THRESHOLDS.CRITICAL;

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const traceId = logger.newTrace();
		const request = context.switchToHttp().getRequest();
		const startTime = Date.now();

		// Extract request metadata
		const endpoint = request.path;
		const method = request.method;
		const userId = request.user?.sub ?? 'anonymous';
		const userAgent = request.get('user-agent') ?? 'unknown';
		request.traceId = traceId;

		return next.handle().pipe(
			tap(_data => {
				const duration = calculateDuration(startTime);

				// Track performance metrics
				this.trackPerformanceMetrics(endpoint, method, duration, userId);

				// Log performance data
				this.logPerformanceData(endpoint, method, duration, userAgent, userId);

				// Alert on slow requests
				if (duration > this.SLOW_REQUEST_THRESHOLD) {
					this.alertSlowRequest(endpoint, method, duration, userId);
				}

				// Track in metrics service
				metricsService.trackRequestPerformance(endpoint, duration, {
					method,
					userId,
					userAgent,
				});
			}),
			catchError(error => {
				const duration = calculateDuration(startTime);

				// Track error performance
				this.trackErrorPerformance(endpoint, method, duration, error, userId);

				throw error;
			})
		);
	}

	private trackPerformanceMetrics(endpoint: string, method: string, duration: number, userId: string): void {
		// Track endpoint performance
		metricsService.trackEndpointPerformance(endpoint, {
			method,
			duration,
			userId,
			timestamp: new Date(),
		});

		// Track method performance
		metricsService.trackMethodPerformance(method, {
			endpoint,
			duration,
			userId,
			timestamp: new Date(),
		});
	}

	private logPerformanceData(
		endpoint: string,
		method: string,
		duration: number,
		userAgent: string,
		userId: string
	): void {
		logger.performance('request.completed', duration, {
			endpoint,
			method,
			userId,
			userAgent: userAgent.substring(0, 100), // Truncate long user agents
			context: 'PerformanceInterceptor',
		});
	}

	private alertSlowRequest(endpoint: string, method: string, duration: number, userId: string): void {
		const severity = duration > this.CRITICAL_REQUEST_THRESHOLD ? 'critical' : 'warning';

		logger.performance(`request.${severity}`, duration, {
			endpoint,
			method,
			userId,
			threshold: this.SLOW_REQUEST_THRESHOLD,
			severity,
			context: 'PerformanceInterceptor',
		});

		// Track slow request metrics
		metricsService.trackSlowRequest(endpoint, {
			method,
			duration,
			userId,
			severity,
			timestamp: new Date(),
		});
	}

	private trackErrorPerformance(
		endpoint: string,
		method: string,
		duration: number,
		error: Error,
		userId: string
	): void {
		logger.performance('request.error', duration, {
			endpoint,
			method,
			userId,
			errorInfo: { message: getErrorMessage(error) },
			context: 'PerformanceInterceptor',
		});

		// Track error performance metrics
		metricsService.trackErrorPerformance(endpoint, {
			method,
			duration,
			userId,
			errorInfo: { message: getErrorMessage(error) },
			timestamp: new Date(),
		});
	}
}
