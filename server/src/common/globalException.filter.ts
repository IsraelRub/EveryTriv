import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

import { serverLogger as logger } from '@shared';
import { NestRequest, NestResponse } from 'src/internal/types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

	catch(exception: Error | HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<NestResponse>();
		const request = ctx.getRequest<NestRequest>();

		const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

		const message =
			exception instanceof HttpException ? exception.getResponse() : exception.message || 'Internal server error';

		// Handle validation errors specifically
		if (exception instanceof HttpException && status === HttpStatus.BAD_REQUEST) {
			const exceptionResponse = exception.getResponse();
			if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'errors' in exceptionResponse) {
				// This is a validation error with detailed error information
				return response.status(status).json({
					statusCode: status,
					path: request.url || 'unknown',
					message: 'Validation failed',
					errors: (exceptionResponse as { errors: unknown }).errors,
				});
			}
		}

		// Log the error with essential context only
		logger.systemError(`Global Exception: ${exception.message}`, {
			status,
			path: request.url || 'unknown',
			stack: exception.stack || 'no stack trace',
		});

		// Send error response with essential information only
		const errorResponse: {
			statusCode: number;
			path: string;
			message: string;
		} = {
			statusCode: status,
			path: request.url || 'unknown',
			message:
				typeof message === 'string'
					? message
					: ((message as Record<string, unknown>).message as string) || 'Internal server error',
		};

		// Send the error response
		response.status(status).json(errorResponse);
	}
}
