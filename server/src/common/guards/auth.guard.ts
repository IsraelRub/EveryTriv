/**
 * Authentication Guard
 *
 * @module AuthGuard
 * @description Guard that validates JWT tokens and extracts user information
 * @author EveryTriv Team
 */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AUTH_CONSTANTS, serverLogger as logger, TokenExtractionService } from '@shared';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Check if endpoint is marked as public
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

		if (isPublic) {
			logger.authDebug('Public endpoint - skipping auth check');
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const token = TokenExtractionService.extractTokenFromRequest(request);

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

}
