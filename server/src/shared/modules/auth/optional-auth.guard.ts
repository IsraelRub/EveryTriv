import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AUTH_CONSTANTS } from '../../constants';

/**
 * Guard that authenticates users if a token is present, but doesn't reject the request if no token is provided
 * Used for endpoints that can work with or without authentication
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
	constructor(private jwtService: JwtService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = request.authToken; // Set by AuthMiddleware

		if (!token) {
			// No token, but that's OK - continue as unauthenticated
			return true;
		}

		// Try to verify token but don't block if invalid
		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: AUTH_CONSTANTS.JWT_SECRET,
			});
			// Add user to request if valid
			request.user = {
				id: payload.sub,
				email: payload.email,
				username: payload.username,
				role: payload.role,
			};
		} catch (error) {
			// Invalid token, but that's OK - continue as unauthenticated
		}

		return true;
	}
}
