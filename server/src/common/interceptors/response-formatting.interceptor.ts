/**
 * Response Formatting Interceptor
 *
 * @module ResponseFormattingInterceptor
 * @description Interceptor that standardizes API response format across all endpoints
 * @author EveryTriv Team
 */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { serverLogger as logger } from '@shared';
import type { NestRequest } from '../../internal/types';

/**
 * Response Formatting Interceptor
 * @description Automatically formats all API responses with consistent structure
 * @example
 * ```typescript
 * // Before: Manual formatting in each controller
 * return {
 *   success: true,
 *   data: result,
 *   timestamp: new Date().toISOString(),
 * };
 * 
 * // After: Automatic formatting by interceptor
 * return result; // Interceptor handles the rest
 * ```
 */
@Injectable()
export class ResponseFormattingInterceptor implements NestInterceptor {
	/**
	 * Intercept responses and format them consistently
	 * @param context - Execution context
	 * @param next - Call handler
	 * @returns Observable with formatted response
	 */
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const startTime = Date.now();

		return next.handle().pipe(
			map((data) => {
				const duration = Date.now() - startTime;
				
				// Skip formatting for certain response types
				if (this.shouldSkipFormatting(data, request)) {
					return data;
				}

				// Log successful response formatting
				logger.apiInfo('Response formatted', {
					method: request.method,
					path: request.path,
					duration,
					hasData: !!data,
					dataType: typeof data,
				});

				// Standard response format
				return {
					success: true,
					data,
					timestamp: new Date().toISOString(),
					meta: {
						duration,
						endpoint: request.path,
						method: request.method,
					},
				};
			})
		);
	}

	/**
	 * Determine if response formatting should be skipped
	 * @param data - Response data
	 * @param request - HTTP request
	 * @returns True if formatting should be skipped
	 */
	private shouldSkipFormatting(data: unknown, request: NestRequest): boolean {
		// Skip formatting for:
		// 1. Already formatted responses
		if (data && typeof data === 'object' && 'success' in data) {
			return true;
		}

		// 2. File downloads and streams
		if (data && typeof data === 'object' && 'pipe' in data) {
			return true;
		}

		// 3. Redirect responses
		if (data && typeof data === 'object' && 'url' in data) {
			return true;
		}

		// 4. Static file serving
		if (request.path.includes('/static/') || request.path.includes('/assets/')) {
			return true;
		}

		// 5. Health check endpoints
		if (request.path === '/health' || request.path === '/status') {
			return true;
		}

		return false;
	}
}
