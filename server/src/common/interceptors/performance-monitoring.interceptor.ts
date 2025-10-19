/**
 * Performance Monitoring Interceptor
 *
 * @module PerformanceMonitoringInterceptor
 * @description Interceptor that tracks request performance metrics and identifies bottlenecks
 * @author EveryTriv Team
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { PERFORMANCE_THRESHOLDS } from '@shared/constants';
import { metricsService,serverLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Performance Monitoring Interceptor
 * @description Tracks request duration, memory usage, and performance metrics
 */
@Injectable()
export class PerformanceMonitoringInterceptor implements NestInterceptor {
	private readonly SLOW_REQUEST_THRESHOLD = PERFORMANCE_THRESHOLDS.SLOW;
	private readonly VERY_SLOW_REQUEST_THRESHOLD = PERFORMANCE_THRESHOLDS.VERY_SLOW;

	constructor() {}

	/**
	 * Intercept requests and monitor performance
	 * @param context - Execution context
	 * @param next - Call handler
	 * @returns Observable with performance monitoring
	 */
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest();
		const startTime = Date.now();
		const startMemory = process.memoryUsage();

		// Extract request metadata
		const endpoint = request.path;
		const method = request.method;
		const userId = request.user?.id || 'anonymous';
		const userAgent = request.get('user-agent') || 'unknown';

		return next.handle().pipe(
			tap(_data => {
				const duration = Date.now() - startTime;
				const endMemory = process.memoryUsage();
				const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

				// Track performance metrics
				this.trackPerformanceMetrics(endpoint, method, duration, memoryDelta, userId);

				// Log performance data
				this.logPerformanceData(endpoint, method, duration, memoryDelta, userAgent, userId);

				// Alert on slow requests
				if (duration > this.SLOW_REQUEST_THRESHOLD) {
					this.alertSlowRequest(endpoint, method, duration, userId);
				}

				// Track in metrics service
				metricsService.trackRequestPerformance(endpoint, duration, {
					method,
					userId,
					memoryDelta,
					userAgent,
				});
			}),
			catchError(error => {
				const duration = Date.now() - startTime;

				// Track error performance
				this.trackErrorPerformance(endpoint, method, duration, error, userId);

				throw error;
			})
		);
	}

	/**
	 * Track performance metrics
	 * @param endpoint - Request endpoint
	 * @param method - HTTP method
	 * @param duration - Request duration
	 * @param memoryDelta - Memory usage change
	 * @param userId - User ID
	 */
	private trackPerformanceMetrics(
		endpoint: string,
		method: string,
		duration: number,
		memoryDelta: number,
		userId: string
	): void {
		// Track endpoint performance
		metricsService.trackEndpointPerformance(endpoint, {
			method,
			duration,
			memoryDelta,
			userId,
			timestamp: new Date(),
		});

		// Track method performance
		metricsService.trackMethodPerformance(method, {
			endpoint,
			duration,
			memoryDelta,
			userId,
			timestamp: new Date(),
		});
	}

	/**
	 * Log performance data
	 * @param endpoint - Request endpoint
	 * @param method - HTTP method
	 * @param duration - Request duration
	 * @param memoryDelta - Memory usage change
	 * @param userAgent - User agent
	 * @param userId - User ID
	 */
	private logPerformanceData(
		endpoint: string,
		method: string,
		duration: number,
		memoryDelta: number,
		userAgent: string,
		userId: string
	): void {
		logger.performance('request.completed', duration, {
			endpoint,
			method,
			memoryDelta,
			userId,
			userAgent: userAgent.substring(0, 100), // Truncate long user agents
			context: 'PerformanceMonitoringInterceptor',
		});
	}

	/**
	 * Alert on slow requests
	 * @param endpoint - Request endpoint
	 * @param method - HTTP method
	 * @param duration - Request duration
	 * @param userId - User ID
	 */
	private alertSlowRequest(endpoint: string, method: string, duration: number, userId: string): void {
		const severity = duration > this.VERY_SLOW_REQUEST_THRESHOLD ? 'critical' : 'warning';

		logger.performance(`request.${severity}`, duration, {
			endpoint,
			method,
			userId,
			threshold: this.SLOW_REQUEST_THRESHOLD,
			severity,
			context: 'PerformanceMonitoringInterceptor',
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

	/**
	 * Track error performance
	 * @param endpoint - Request endpoint
	 * @param method - HTTP method
	 * @param duration - Request duration
	 * @param error - Error object
	 * @param userId - User ID
	 */
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
			error: getErrorMessage(error),
			context: 'PerformanceMonitoringInterceptor',
		});

		// Track error performance metrics
		metricsService.trackErrorPerformance(endpoint, {
			method,
			duration,
			userId,
			error: getErrorMessage(error),
			timestamp: new Date(),
		});
	}
}
