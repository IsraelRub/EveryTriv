/**
 * WebSocket Authentication Guard
 *
 * @module WsAuthGuard
 * @description Guard that validates JWT tokens for WebSocket connections
 * @used_by server/src/features/game/multiplayer/multiplayer.gateway.ts
 */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';

import { AUTH_CONSTANTS } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { isPublicEndpoint } from '@internal/utils';

/**
 * WebSocket Authentication Guard
 * Validates JWT tokens for WebSocket connections
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Check if endpoint is marked as public via decorators
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

		// Get WebSocket client
		const client = context.switchToWs().getClient<Socket>();
		const request = client.handshake;

		// Check if endpoint is public using centralized function
		const isHardcodedPublic = isPublicEndpoint(request.url || '');

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
			request.auth?.token || request.headers?.authorization?.replace('Bearer ', '') || request.query?.token || null;

		if (!token) {
			logger.securityDenied('No authentication token provided for WebSocket connection');
			throw new UnauthorizedException('Authentication token required');
		}

		try {
			// Verify JWT token
			const payload = await this.jwtService.verifyAsync(token, {
				secret: AUTH_CONSTANTS.JWT_SECRET,
			});

			// Attach user to client data
			client.data.user = payload;
			client.data.userId = payload.sub;
			client.data.userRole = payload.role;

			logger.securityLogin('WebSocket authentication successful', {
				userId: payload.sub,
				role: payload.role,
			});

			return true;
		} catch (error) {
			logger.securityDenied('Invalid authentication token for WebSocket', {
				error: getErrorMessage(error),
			});
			throw new UnauthorizedException('Invalid authentication token');
		}
	}
}
