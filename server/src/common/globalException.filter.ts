import { getErrorMessage, getErrorStack, getErrorType, serverLogger as logger } from '@shared';
import { NestRequest, NestResponse } from 'src/internal/types';

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	catch(exception: Error | HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<NestResponse>();
		const request = ctx.getRequest<NestRequest>();

		const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
		const errorMessage = getErrorMessage(exception);
		const errorType = getErrorType(exception);

		// Handle validation errors specifically
		if (exception instanceof HttpException && status === HttpStatus.BAD_REQUEST) {
			const exceptionResponse = exception.getResponse();
			if (typeof exceptionResponse === 'object' && exceptionResponse && 'errors' in exceptionResponse) {
				// This is a validation error with detailed error information
				return response.status(status).json({
					statusCode: status,
					path: request.url ?? 'unknown',
					message: 'Validation failed',
					errors: (exceptionResponse as { errors: unknown }).errors,
				});
			}
		}

		// Log the error with enhanced context (stack trace only in logs, not in response)
		logger.systemError(`Global Exception: ${errorMessage}`, {
			status,
			path: request.url ?? 'unknown',
			method: request.method || 'unknown',
			userAgent: request.headers?.['user-agent'] || 'unknown',
			ip: request.ip || 'unknown',
			errorType,
			stack: getErrorStack(exception),
			timestamp: new Date().toISOString(),
		});

		// Send sanitized error response (no stack traces or sensitive info)
		const errorResponse = {
			statusCode: status,
			path: request.url ?? 'unknown',
			message: errorMessage,
			timestamp: new Date().toISOString(),
		};

		// Add error type only for client errors (4xx), not server errors (5xx)
		if (status >= 400 && status < 500) {
			(errorResponse as Record<string, unknown>).errorType = errorType;
		}

		response.status(status).json(errorResponse);
	}
}
