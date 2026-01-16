import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { ERROR_CODES } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { AppConfig } from '@config';
import { serverLogger as logger, TokenExtractionService } from '@internal/services';
import { isPublicEndpoint } from '@internal/utils';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

		const request = context.switchToHttp().getRequest();

		const isHardcodedPublic = isPublicEndpoint(request.path ?? '');

		logger.authDebug('AuthGuard check', {
			path: request.path,
			method: request.method,
			isPublic,
			isHardcodedPublic,
		});

		if (isPublic || isHardcodedPublic) {
			logger.authDebug('Public endpoint - skipping auth check');
			return true;
		}
		const token = TokenExtractionService.extractTokenFromRequest(request);

		if (!token) {
			logger.securityDenied('No authentication token provided');
			throw new UnauthorizedException(ERROR_CODES.AUTHENTICATION_TOKEN_REQUIRED);
		}

		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: AppConfig.jwt.secret,
			});

			logger.authDebug('JWT token verified', {
				userId: payload.sub,
				emails: { current: payload.email },
				role: payload.role,
			});

			request.user = payload;
			request.userRole = payload.role;

			logger.securityLogin('Authentication successful', {
				userId: payload.sub,
				role: payload.role,
			});

			return true;
		} catch (error) {
			logger.securityDenied('Invalid authentication token', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw new UnauthorizedException(ERROR_CODES.INVALID_AUTHENTICATION_TOKEN);
		}
	}
}
