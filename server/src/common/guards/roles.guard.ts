/**
 * Roles Guard
 *
 * @module RolesGuard
 * @description Guard that checks user roles and permissions
 * @author EveryTriv Team
 */
import { UserRole, serverLogger as logger } from '@shared';

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		// Check if endpoint is marked as public
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

		const request = context.switchToHttp().getRequest();

		// Fallback: also honor decorator-aware middleware metadata if present
		const middlewarePublicFlag: boolean | undefined = request?.decoratorMetadata?.isPublic;

		// Hardcoded public endpoints as fallback
		const publicEndpoints = ['/leaderboard/global', '/leaderboard/period', '/health', '/status'];
		const isHardcodedPublic = publicEndpoints.some(endpoint => request.path?.includes(endpoint) || false);

		if (isPublic || middlewarePublicFlag || isHardcodedPublic) {
			logger.authDebug('Public endpoint - skipping role check');
			return true;
		}

		// Get required roles from decorator
		const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
			context.getHandler(),
			context.getClass(),
		]);

		// If no roles required, allow access
		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		const user = request.user;

		if (!user) {
			logger.securityDenied('No user found in request for role check');
			throw new ForbiddenException('User not authenticated');
		}

		const userRole = user.role || UserRole.USER;

		// Check if user has required role
		const hasRole = requiredRoles.includes(userRole);

		if (!hasRole) {
			logger.securityDenied('Insufficient role for endpoint', {
				userId: user.sub,
				userRole,
				requiredRoles,
			});
			throw new ForbiddenException({
				message: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
				details: {
					userRole,
					requiredRoles,
					userId: user.sub,
				},
				timestamp: new Date().toISOString(),
			});
		}

		logger.securityLogin('Role check passed', {
			userId: user.sub,
			role: userRole,
			requiredRoles,
		});

		return true;
	}
}
