/**
 * Authentication Guard
 *
 * @module AuthGuard
 * @description Guard that validates JWT tokens and extracts user information
 */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { ERROR_CODES } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { AUTH_CONSTANTS } from '@internal/constants';
import { serverLogger as logger, TokenExtractionService } from '@internal/services';
import { isPublicEndpoint } from '@internal/utils';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Check if endpoint is marked as public via decorators
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

		const request = context.switchToHttp().getRequest();

		// Fallback: also honor decorator-aware middleware metadata if present
		const middlewarePublicFlag: boolean | undefined = request?.decoratorMetadata?.isPublic;

		// Check if endpoint is public using centralized function
		const isHardcodedPublic = isPublicEndpoint(request.path || '');

		// Debug logging
		logger.authDebug('AuthGuard check', {
			path: request.path,
			method: request.method,
			isPublic,
			middlewarePublicFlag,
			isHardcodedPublic,
		});

		if (isPublic || middlewarePublicFlag || isHardcodedPublic) {
			logger.authDebug('Public endpoint - skipping auth check');
			return true;
		}
		const token = TokenExtractionService.extractTokenFromRequest(request);

		if (!token) {
			logger.securityDenied('No authentication token provided');
			throw new UnauthorizedException(ERROR_CODES.AUTHENTICATION_TOKEN_REQUIRED);
		}

		try {
			// Verify JWT token
			const payload = await this.jwtService.verifyAsync(token, {
				secret: AUTH_CONSTANTS.JWT_SECRET,
			});

			logger.authDebug('JWT token verified', {
				userId: payload.sub,
				email: payload.email,
				role: payload.role,
			});

			// Attach user to request
			request.user = payload;
			request.userRole = payload.role;

			logger.securityLogin('Authentication successful', {
				userId: payload.sub,
				role: payload.role,
			});

			return true;
		} catch (error) {
			logger.securityDenied('Invalid authentication token', {
				error: getErrorMessage(error),
			});
			throw new UnauthorizedException(ERROR_CODES.INVALID_AUTHENTICATION_TOKEN);
		}
	}
}
