/**
 * Authentication Guard
 *
 * @module AuthGuard
 * @description Guard that validates JWT tokens and extracts user information
 * @author EveryTriv Team
 */
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { serverLogger as logger } from '@shared';
import { AUTH_CONSTANTS, AuthenticationRequest } from '@shared';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Check if endpoint is marked as public
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) {
			logger.authDebug('Public endpoint - skipping auth check');
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			logger.securityDenied('No authentication token provided');
			throw new UnauthorizedException('Authentication token required');
		}

		try {
			// Verify JWT token
			const payload = await this.jwtService.verifyAsync(token, {
				secret: AUTH_CONSTANTS.JWT_SECRET,
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
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new UnauthorizedException('Invalid authentication token');
		}
	}

	private extractTokenFromHeader(request: AuthenticationRequest): string | undefined {
		// Try to get token from request.authToken (set by middleware)
		if (request.authToken) {
			return request.authToken;
		}

		// Fallback to header extraction
		const [type, token] = request.headers?.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
