import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ErrorCode } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { AUTH_CONSTANTS, COOKIE_NAMES } from '@internal/constants';
import { UserEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';
import { isPublicEndpoint } from '@internal/utils';

import { resolveAuthenticatedUser } from './authenticatedUser.util';

@Injectable()
export class LocalAuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

		const request = context.switchToHttp().getRequest();

		const isHardcodedPublic = isPublicEndpoint(request.path ?? '');

		logger.authDebug('LocalAuthGuard check', {
			path: request.path,
			method: request.method,
			isPublic,
			isHardcodedPublic,
		});

		if (isPublic || isHardcodedPublic) {
			logger.authDebug('Public endpoint - skipping auth check');
			return true;
		}

		const authHeader = request.headers?.[AUTH_CONSTANTS.AUTH_HEADER.toLowerCase()];
		const authHeaderString = Array.isArray(authHeader) ? authHeader[0] : authHeader;
		const token = authHeaderString?.startsWith(`${AUTH_CONSTANTS.TOKEN_TYPE} `)
			? authHeaderString.substring(AUTH_CONSTANTS.TOKEN_TYPE.length + 1)
			: (request.cookies?.[COOKIE_NAMES.AUTH_TOKEN] ??
				(authHeaderString && !authHeaderString.startsWith('Bearer ') ? authHeaderString : null));

		if (!token) {
			logger.securityDenied('No authentication token provided');
			throw new UnauthorizedException(ErrorCode.AUTHENTICATION_TOKEN_REQUIRED);
		}

		try {
			const payload = await resolveAuthenticatedUser(token, this.jwtService, this.userRepository);

			request.user = { ...payload };
			request.userRole = request.user.role;

			logger.authDebug('JWT token verified, role from DB', {
				userId: payload.sub,
				role: request.user.role,
			});
			logger.securityLogin('Authentication successful', {
				userId: payload.sub,
				role: request.user.role,
			});

			return true;
		} catch (error) {
			logger.securityDenied('Invalid authentication token', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw new UnauthorizedException(ErrorCode.INVALID_AUTHENTICATION_TOKEN);
		}
	}
}
