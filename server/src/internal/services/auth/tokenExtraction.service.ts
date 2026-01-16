import { AUTH_CONSTANTS, COOKIE_NAMES } from '@shared/constants';
import type { AuthenticationRequest } from '@shared/types';

export class TokenExtractionService {
	static extractToken(
		authHeader: string | string[] | undefined,
		cookies: Record<string, string> | undefined
	): string | null {
		let token: string | null = null;

		// Convert authHeader to string if it's an array
		const authHeaderString = Array.isArray(authHeader) ? authHeader[0] : authHeader;

		// Priority 1: Authorization header with Bearer token
		if (authHeaderString?.startsWith(`${AUTH_CONSTANTS.TOKEN_TYPE} `)) {
			token = authHeaderString.substring(AUTH_CONSTANTS.TOKEN_TYPE.length + 1);
		}
		// Priority 2: Cookie token
		else if (cookies?.[COOKIE_NAMES.AUTH_TOKEN]) {
			const cookieToken = cookies[COOKIE_NAMES.AUTH_TOKEN];
			token = cookieToken ?? null;
		}
		// Priority 3: Direct token in header (fallback)
		else if (authHeaderString && !authHeaderString.startsWith('Bearer ')) {
			token = authHeaderString;
		}

		return token;
	}

	static extractTokenFromRequest(request: AuthenticationRequest): string | null {
		const authHeader = request.headers?.[AUTH_CONSTANTS.AUTH_HEADER.toLowerCase()];
		const cookies = request.cookies ? this.filterUndefinedValues(request.cookies) : undefined;

		return this.extractToken(authHeader, cookies);
	}

	private static filterUndefinedValues(cookies: Record<string, string | undefined>): Record<string, string> {
		const filtered: Record<string, string> = {};
		for (const [key, value] of Object.entries(cookies)) {
			if (value !== undefined) {
				filtered[key] = value;
			}
		}
		return filtered;
	}

	static isValidTokenFormat(token: string): boolean {
		if (!token || typeof token !== 'string') {
			return false;
		}

		// Basic JWT format validation (3 parts separated by dots)
		const parts = token.split('.');
		return parts.length === 3;
	}
}
