import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { calculateDuration, isRecord } from '@shared/utils';

import type { NestRequest } from '@internal/types';

@Injectable()
export class ResponseFormatter implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest();
		const startTime = Date.now();

		return next.handle().pipe(
			map(data => {
				const duration = calculateDuration(startTime);

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
						endpoint: request.path ?? 'unknown',
						method: request.method ?? 'unknown',
					},
				};
			})
		);
	}

	private shouldSkipFormatting(data: unknown, request: NestRequest): boolean {
		if (isRecord(data)) {
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
		if (request.path === '/status' || request.path?.startsWith('/api/health')) {
			return true;
		}

		return false;
	}
}
