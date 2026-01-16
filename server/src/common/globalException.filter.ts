import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	ForbiddenException,
	HttpException,
	HttpStatus,
	UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';

import type { ErrorResponse } from '@shared/types';
import {
	getErrorMessage,
	getErrorStack,
	getErrorType,
	isValidationErrorResponse,
	parseValidationErrorResponse,
} from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { NestRequest } from '../internal/types';

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
				// Use shared utility to parse validation error response
				const validationError = parseValidationErrorResponse(exceptionResponse);

				if (validationError) {
					// Debug: Log validation error details
					const errorMessage = typeof validationError.message === 'string' ? validationError.message : undefined;
					const errorArray = Array.isArray(validationError.errors) ? validationError.errors : undefined;
					logger.validationError('global_validation_error', '[REDACTED]', 'validation_failed', {
						path: request.url ?? 'unknown',
						method: request.method ?? 'unknown',
						errorInfo: {
							message: errorMessage,
							messages: errorArray,
						},
						body: request.body ? JSON.stringify(request.body).substring(0, 200) : 'no body',
					});

					// This is a validation error with detailed error information
					const validationMessage =
						typeof validationError.message === 'string' && validationError.message.trim().length > 0
							? validationError.message
							: 'Validation failed';

					return response.status(status).json({
						statusCode: status,
						path: request.url ?? 'unknown',
						message: validationMessage,
						errors: validationError.errors,
						timestamp: new Date().toISOString(),
					});
				}
			}
		}

		// Skip logging for authentication/authorization errors that are already logged by guards
		const isAuthError = exception instanceof UnauthorizedException || exception instanceof ForbiddenException;
		if (isAuthError) {
			// These errors are already logged by AuthGuard and RolesGuard, skip logging here
		} else if (status >= 500) {
			// Log server errors (5xx) as ERROR
			logger.systemError(`Global Exception: ${errorMessage}`, {
				status,
				httpStatus: {
					code: status,
				},
				path: request.url ?? 'unknown',
				method: request.method || 'unknown',
				userAgent: request.headers?.['user-agent'] ?? 'unknown',
				ip: request.ip ?? 'unknown',
				errorInfo: {
					type: errorType,
					message: errorMessage,
				},
				stack: getErrorStack(exception),
				timestamp: new Date().toISOString(),
			});
		}
		// For other 4xx errors, don't log here as they should be handled by specific handlers

		// Check if this is a frontend request (not an API request)
		// Frontend requests typically don't have Accept: application/json header
		// Also check if the request method is GET (typical for page navigation)
		const acceptHeader = request.headers.accept ?? '';
		const isApiRequest =
			acceptHeader.includes('application/json') || request.url?.startsWith('/api/') || request.method !== 'GET';

		// For 404 errors on frontend routes (GET requests without JSON accept header)
		// Return 404 without JSON body - this allows Vite's proxy to handle it
		// and serve the SPA's index.html, which will then let React Router handle the route
		if (status === HttpStatus.NOT_FOUND && !isApiRequest) {
			// Return 404 without body - Vite proxy should intercept and serve index.html
			// This allows React Router to handle the route on the client side
			return response.status(status).end();
		}

		// Send sanitized error response (no stack traces or sensitive info)
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
