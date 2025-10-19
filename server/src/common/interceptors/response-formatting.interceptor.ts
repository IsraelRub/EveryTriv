/**
 * Response Formatting Interceptor
 *
 * @module ResponseFormattingInterceptor
 * @description Interceptor that standardizes API response format across all endpoints
 * @author EveryTriv Team
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { NestRequest } from '../../internal/types';

/**
 * Response Formatting Interceptor
 * @description Automatically formats all API responses with consistent structure
 */
@Injectable()
export class ResponseFormattingInterceptor implements NestInterceptor {
	/**
	 * Intercept responses and format them consistently
	 * @param context - Execution context
	 * @param next - Call handler
	 * @returns Observable with formatted response
	 */
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest();
		const startTime = Date.now();

		return next.handle().pipe(
			map(data => {
				const duration = Date.now() - startTime;

				// Skip formatting for certain response types
				if (this.shouldSkipFormatting(data, request)) {
					return data;
				}

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
		if (data && typeof data === 'object') {
			// Skip formatting if response already has a success field (like AuthenticationResult)
			if ('success' in data) {
				return true;
			}
			
			const skipFields = ['isValid', 'timestamp', 'data', 'pipe', 'url'];
			return skipFields.some(field => field in data);
		}

		// 7. Static file serving
		if (request.path.includes('/static/') || request.path.includes('/assets/')) {
			return true;
		}

		// 8. Health check endpoints
		if (request.path === '/health' || request.path === '/status') {
			return true;
		}

		return false;
	}
}
