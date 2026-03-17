import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Socket } from 'socket.io';
import { Repository } from 'typeorm';

import { ErrorCode } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { UserEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';
import { isPublicEndpoint } from '@internal/utils';

import { resolveAuthenticatedUser } from './authenticatedUser.util';

@Injectable()
export class WsAuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Check if endpoint is marked as public via decorators
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

		// Get WebSocket client
		const client = context.switchToWs().getClient<Socket>();
		const request = client.handshake;

		// Check if endpoint is public using centralized function
		const isHardcodedPublic = isPublicEndpoint(request.url ?? '');

		// Debug logging
		logger.authDebug('WsAuthGuard check', {
			url: request.url,
			isPublic,
			isHardcodedPublic,
		});

		if (isPublic || isHardcodedPublic) {
			logger.authDebug('Public WebSocket endpoint - skipping auth check');
			return true;
		}

		// Extract token from handshake query params or authorization header
		const token =
			request.auth?.token ?? request.headers?.authorization?.replace('Bearer ', '') ?? request.query?.token ?? null;

		if (!token) {
			logger.securityDenied('No authentication token provided for WebSocket connection');
			throw new UnauthorizedException(ErrorCode.AUTHENTICATION_TOKEN_REQUIRED);
		}

		try {
			const payload = await resolveAuthenticatedUser(token, this.jwtService, this.userRepository);

			client.data.user = { ...payload };
			client.data.userId = payload.sub;
			client.data.userRole = client.data.user.role;

			logger.securityLogin('WebSocket authentication successful', {
				userId: payload.sub,
				role: client.data.user.role,
			});

			return true;
		} catch (error) {
			logger.securityDenied('Invalid authentication token for WebSocket', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw new UnauthorizedException(ErrorCode.INVALID_AUTHENTICATION_TOKEN);
		}
	}
}
