import { ForbiddenException, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AUTH_CONSTANTS, UserRole } from '../constants';
import { LoggerService } from '../controllers';
import { NestNextFunction, NestRequest, NestResponse } from '../types';

/**
 * Middleware that checks the user's role
 * Validates if user is admin or regular user using JWT token
 */
@Injectable()
export class RoleCheckMiddleware implements NestMiddleware {
	constructor(
		private readonly jwtService: JwtService,
		private readonly logger: LoggerService
	) {}

	async use(req: NestRequest, _res: NestResponse, next: NestNextFunction) {
		try {
			// Get token from the request (set by AuthMiddleware)
			const authHeader = req.headers[AUTH_CONSTANTS.AUTH_HEADER.toLowerCase()];
			const authHeaderString = Array.isArray(authHeader) ? authHeader[0] : authHeader;
			const token = req.authToken || authHeaderString?.split(' ')[1];

			if (token) {
				try {
					// Verify JWT token
					const payload = await this.jwtService.verifyAsync(token);

					// Extract role from token payload
					const userRole = payload.role || UserRole.USER;

					// Set role in request object for controllers to use
					req.userRole = userRole;
					req.user = payload;

					this.logger.securityLogin('Role check passed', {
						userId: payload.sub,
						role: userRole,
						route: req.route?.path,
					});

					// Check for admin routes if needed
					if (req.path.startsWith('/admin') && userRole !== UserRole.ADMIN) {
						this.logger.securityDenied('Unauthorized admin access attempt', {
							userId: payload.sub,
							role: userRole,
							route: req.route?.path,
						});
						throw new ForbiddenException('Admin access required');
					}
				} catch (jwtError) {
					this.logger.securityDenied('Invalid JWT token in role check', {
						error: jwtError instanceof Error ? jwtError.message : 'Unknown error',
						route: req.route?.path,
					});
					throw new UnauthorizedException('Invalid token');
				}
			} else {
				// No token - set default role for public routes
				req.userRole = UserRole.GUEST;

				this.logger.securityLogin('No token - public access', {
					route: req.route?.path,
				});
			}

			next();
		} catch (error) {
			if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
				throw error;
			}

			this.logger.securityDenied('Role check middleware error', {
				error: error instanceof Error ? error.message : 'Unknown error',
				route: req.route?.path,
			});

			throw new UnauthorizedException('Role verification failed');
		}
	}
}
