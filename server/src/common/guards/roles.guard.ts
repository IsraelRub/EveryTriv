import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ERROR_CODES, UserRole } from '@shared/constants';

import { serverLogger as logger } from '@internal/services';
import { isPublicEndpoint } from '@internal/utils';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		// Check if endpoint is marked as public
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

		const request = context.switchToHttp().getRequest();

		// Check if endpoint is public using centralized function
		const isHardcodedPublic = isPublicEndpoint(request.path ?? '');

		if (isPublic || isHardcodedPublic) {
			logger.authDebug('Public endpoint - skipping role check');
			return true;
		}

		// Get required roles from decorator
		const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
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
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}

		const userRole = user.role ?? UserRole.USER;

		// Check if user has required role
		const hasRole = requiredRoles.includes(userRole);

		if (!hasRole) {
			logger.securityDenied('Insufficient role for endpoint', {
				userId: user.sub,
				role: userRole,
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
