import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

import { LoggerService } from '../shared/controllers';
import { NestRequest, NestResponse } from '../shared/types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	constructor(private readonly logger: LoggerService) {}

	catch(exception: Error | HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<NestResponse>();
		const request = ctx.getRequest<NestRequest>();

		const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

		const message =
			exception instanceof HttpException ? exception.getResponse() : exception.message || 'Internal server error';

		// Check if this is a Google OAuth related error
		const isGoogleOAuthError =
			request.url?.includes('/auth/google') ||
			exception.message?.includes('Google OAuth') ||
			exception.message?.includes('passport');

		// Log the error with additional context for Google OAuth errors
		this.logger.systemError(`Global Exception: ${exception.message}`, {
			status,
			path: request.url,
			method: request.method,
			userAgent: request.get('User-Agent') || 'unknown',
			ip: request.ip || 'unknown',
			stack: exception.stack || 'no stack trace',
			isGoogleOAuthError,
			googleOAuthContext: isGoogleOAuthError
				? JSON.stringify({
						url: request.url,
						method: request.method,
						headers: request.headers,
						cookies: request.cookies,
					})
				: 'not-google-oauth',
		});

		// Send error response with additional context for Google OAuth errors
		const errorResponse: {
			statusCode: number;
			timestamp: string;
			path: string;
			message: string;
			error?: string;
			details?: string;
			suggestion?: string;
		} = {
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
			message:
				typeof message === 'string'
					? message
					: ((message as Record<string, unknown>).message as string) || 'Internal server error',
		};

		// Add additional context for Google OAuth errors
		if (isGoogleOAuthError) {
			errorResponse.error = 'Google OAuth Error';
			errorResponse.details =
				'There was an issue with Google OAuth authentication. Please try again or contact support.';

			// If it's a configuration error, provide more specific guidance
			if (exception.message?.includes('not configured') || exception.message?.includes('credentials')) {
				errorResponse.details =
					'Google OAuth is not properly configured on the server. This is a server configuration issue.';
				errorResponse.suggestion = 'Please contact the administrator to configure Google OAuth properly.';
			}
		}

		response.status(status).json(errorResponse);
	}
}
