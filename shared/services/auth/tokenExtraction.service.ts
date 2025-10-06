/**
 * Token Extraction Service
 *
 * @module TokenExtractionService
 * @description service for extracting authentication tokens from requests
 * @author EveryTriv Team
 */
import { AUTH_CONSTANTS, COOKIE_NAMES } from '../../constants';

/**
 * Service for extracting authentication tokens from various sources
 */
export class TokenExtractionService {
	/**
	 * Extract token from request headers and cookies (LOGIC)
	 * @param authHeader - Authorization header value
	 * @param cookies - Request cookies object
	 * @returns Extracted token or null
	 */
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
			token = cookies[COOKIE_NAMES.AUTH_TOKEN];
		}
		// Priority 3: Direct token in header (fallback)
		else if (authHeaderString && !authHeaderString.startsWith('Bearer ')) {
			token = authHeaderString;
		}

		return token;
	}

	/**
	 * Extract token from request object (for NestJS)
	 * @param request - HTTP request object
	 * @returns Extracted token or null
	 */
	static extractTokenFromRequest(request: any): string | null {
		const authHeader = request.headers[AUTH_CONSTANTS.AUTH_HEADER.toLowerCase()];
		const cookies = request.cookies;

		return this.extractToken(authHeader, cookies);
	}

	/**
	 * Validate token format
	 * @param token - Token to validate
	 * @returns Whether token has valid format
	 */
	static isValidTokenFormat(token: string): boolean {
		if (!token || typeof token !== 'string') {
			return false;
		}

		// Basic JWT format validation (3 parts separated by dots)
		const parts = token.split('.');
		return parts.length === 3;
	}
}
