import { Injectable, NestMiddleware } from '@nestjs/common';
import { serverLogger as logger, TokenExtractionService } from '@shared';

import { NestNextFunction, NestRequest, NestResponse } from '../types';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	constructor() {}

	use(req: NestRequest, _res: NestResponse, next: NestNextFunction) {
		try {
			// Use token extraction logic
			const token = TokenExtractionService.extractTokenFromRequest(req);

			// Store token in request for guards to use
			if (token && TokenExtractionService.isValidTokenFormat(token)) {
				logger.authDebug('Authentication token extracted', {
					tokenType: 'Bearer',
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
