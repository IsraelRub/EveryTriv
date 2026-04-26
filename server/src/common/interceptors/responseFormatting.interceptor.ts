import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { calculateDuration, isRecord } from '@shared/utils';

import { SKIP_RESPONSE_FORMATTER_KEY } from '@common/decorators/skipResponseFormatter.decorator';
import type { NestRequest } from '@internal/types';

@Injectable()
export class ResponseFormatter implements NestInterceptor {
	constructor(private readonly reflector: Reflector) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const skipFormatting = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_FORMATTER_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (skipFormatting) {
			return next.handle();
		}

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
		if (data instanceof StreamableFile) {
			return true;
		}

		if (isRecord(data)) {
			// Skip formatting if response already has a success field (like AuthenticationResult)
			if ('success' in data) {
				return true;
			}

			const skipFields = ['isValid', 'timestamp', 'pipe', 'url'];
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
