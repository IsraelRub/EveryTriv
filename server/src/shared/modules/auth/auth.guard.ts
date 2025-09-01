import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AUTH_CONSTANTS } from '../../constants';
import { LoggerService } from '../../controllers';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly logger: LoggerService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = request.authToken; // Set by AuthMiddleware

		if (!token) {
			this.logger.securityDenied('No authentication token provided', {
				path: context.switchToHttp().getRequest().path,
				method: context.switchToHttp().getRequest().method,
			});
			throw new UnauthorizedException('Authentication token required');
		}

		try {
			// Verify JWT token
			const payload = await this.jwtService.verifyAsync(token, {
				secret: AUTH_CONSTANTS.JWT_SECRET,
			});

			// Attach user to request
			request.user = {
				id: payload.sub,
				email: payload.email,
				username: payload.username,
				role: payload.role,
			};

			this.logger.securityLogin('User authenticated successfully', {
				userId: payload.sub,
				email: payload.email,
				path: context.switchToHttp().getRequest().path,
			});

			return true;
		} catch (error) {
			this.logger.securityDenied('Invalid authentication token', {
				error: error instanceof Error ? error.message : 'Unknown error',
				path: context.switchToHttp().getRequest().path,
			});
			throw new UnauthorizedException('Invalid authentication token');
		}
	}
}
