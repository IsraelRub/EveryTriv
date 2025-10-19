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
import { AUTH_CONSTANTS } from '@shared/constants';
import { serverLogger as logger, TokenExtractionService } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

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

		// Hardcoded public endpoints as fallback
		const publicEndpoints = ['/leaderboard/global', '/leaderboard/period', '/health', '/status'];
		const isHardcodedPublic = publicEndpoints.some(endpoint => request.path?.includes(endpoint) || false);

		// Additional check for leaderboard endpoints
		const isLeaderboardGlobal =
			request.path === '/leaderboard/global' || request.path?.startsWith('/leaderboard/global?') || false;

		// Debug logging
		logger.authDebug('AuthGuard check', {
			path: request.path,
			method: request.method,
			isPublic,
			middlewarePublicFlag,
			isHardcodedPublic,
			hasDecoratorMetadata: !!request?.decoratorMetadata,
		});

		if (isPublic || middlewarePublicFlag || isHardcodedPublic || isLeaderboardGlobal) {
			logger.authDebug('Public endpoint - skipping auth check');
			return true;
		}
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
				error: getErrorMessage(error),
			});
			throw new UnauthorizedException('Invalid authentication token');
		}
	}
}
