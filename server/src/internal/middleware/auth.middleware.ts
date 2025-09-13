import { Injectable, NestMiddleware } from '@nestjs/common';
import { AUTH_CONSTANTS , COOKIE_NAMES , serverLogger as logger } from '@shared';

import { NestNextFunction, NestRequest, NestResponse } from '../types';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	constructor() {}

	use(req: NestRequest, _res: NestResponse, next: NestNextFunction) {
		try {
			// Extract token from auth header or cookies
			const authHeader = req.headers[AUTH_CONSTANTS.AUTH_HEADER.toLowerCase()];
			const cookieToken = req.cookies?.[COOKIE_NAMES.AUTH_TOKEN];

			let token = null;

			// Convert authHeader to string if it's an array
			const authHeaderString = Array.isArray(authHeader) ? authHeader[0] : authHeader;

			if (authHeaderString?.startsWith(`${AUTH_CONSTANTS.TOKEN_TYPE} `)) {
				token = authHeaderString.substring(AUTH_CONSTANTS.TOKEN_TYPE.length + 1);
			} else if (cookieToken) {
				token = cookieToken;
			}

			// Store token in request for guards to use
			if (token) {
				logger.authDebug('Authentication token extracted', {
					tokenType: token.startsWith('Bearer ') ? 'Bearer' : 'Other',
					path: req.path,
					method: req.method,
				});
				req.authToken = token;
			}

			next();
		} catch (error) {
			logger.authError('Auth middleware error', {
				error: error instanceof Error ? error.message : 'Unknown error',
				path: req.path,
				method: req.method,
			});
			next();
		}
	}
}
