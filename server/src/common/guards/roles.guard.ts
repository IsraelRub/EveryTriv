/**
 * Roles Guard
 *
 * @module RolesGuard
 * @description Guard that checks user roles and permissions
 * @author EveryTriv Team
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { serverLogger as logger } from '@shared';
import { UserRole } from '@shared';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		// Get required roles from decorator
		const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
			context.getHandler(),
			context.getClass(),
		]);

		// If no roles required, allow access
		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
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
