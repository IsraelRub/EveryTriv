import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import { serverLogger as logger } from '@shared/services';
import { getErrorMessage, getErrorStack, getErrorType, isRecord } from '@shared/utils';

import { NestRequest } from '@internal/types';

/**
 * Type guard to check if response is a validation error response
 */
function isValidationErrorResponse(response: unknown): response is { errors: unknown } {
	return isRecord(response) && 'errors' in response;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	catch(exception: Error | HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<NestRequest>();

		const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
		const errorMessage = getErrorMessage(exception);
		const errorType = getErrorType(exception);

		// Handle validation errors specifically
		if (exception instanceof HttpException && status === HttpStatus.BAD_REQUEST) {
			const exceptionResponse = exception.getResponse();
			if (isValidationErrorResponse(exceptionResponse)) {
				// This is a validation error with detailed error information
				return response.status(status).json({
					statusCode: status,
					path: request.url ?? 'unknown',
					message: 'Validation failed',
					errors: exceptionResponse.errors,
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
		interface ErrorResponse {
			statusCode: number;
			path: string;
			message: string | string[];
			timestamp: string;
			errorType?: string;
		}

		const errorResponse: ErrorResponse = {
			statusCode: status,
			path: request.url ?? 'unknown',
			message: errorMessage,
			timestamp: new Date().toISOString(),
		};

		// Add error type only for client errors (4xx), not server errors (5xx)
		if (status >= 400 && status < 500) {
			errorResponse.errorType = errorType;
		}

		response.status(status).json(errorResponse);
	}
}
