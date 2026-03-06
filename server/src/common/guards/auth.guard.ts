import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ErrorCode, USER_ROLES, UserRole } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { AppConfig } from '@config';
import { UserEntity } from '@internal/entities';
import { serverLogger as logger, TokenExtractionService } from '@internal/services';
import { isPublicEndpoint } from '@internal/utils';

@Injectable()
export class AuthGuard implements CanActivate {
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
			throw new UnauthorizedException(ErrorCode.AUTHENTICATION_TOKEN_REQUIRED);
		}

		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: AppConfig.jwt.secret,
			});

			request.user = { ...payload };

			const dbUser = await this.userRepository.findOne({
				where: { id: payload.sub },
				select: ['id', 'role'],
			});
			if (dbUser) {
				request.user.role = dbUser.role;
			} else {
				request.user.role = USER_ROLES.has(payload.role) ? payload.role : UserRole.USER;
			}
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
