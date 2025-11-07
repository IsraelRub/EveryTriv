/**
 * JWT Token Service - Centralized JWT token management
 *
 * @module JwtTokenService
 * @description JWT token generation and validation service
 */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AUTH_CONSTANTS, UserRole } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type {
	AuthenticationRequest,
	BasicUser,
	JWTDecodedToken,
	TokenPair,
	TokenPayload,
	TokenValidationResult,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { createServerError } from '@internal/utils';

@Injectable()
export class JwtTokenService {
	constructor(private readonly jwtService: JwtService) {}

	/**
	 * Generate access token
	 */
	async generateAccessToken(
		userId: string,
		username: string,
		email: string,
		role: UserRole,
		expiresIn: string = '1h'
	): Promise<string> {
		try {
			const payload: TokenPayload = {
				sub: userId,
				email,
				username,
				role,
			};

			const token = await this.jwtService.signAsync(payload, {
				secret: AUTH_CONSTANTS.JWT_SECRET,
				expiresIn,
			});

			logger.securityLogin('Access token generated', {
				userId,
				username,
				role,
				expiresIn,
			});

			return token;
		} catch (error) {
			logger.securityError('Failed to generate access token', {
				userId,
				username,
				error: getErrorMessage(error),
			});
			throw createServerError('generate access token', error);
		}
	}

	/**
	 * Generate refresh token
	 */
	async generateRefreshToken(
		userId: string,
		username: string,
		email: string,
		role: UserRole,
		expiresIn: string = '7d'
	): Promise<string> {
		try {
			const payload: TokenPayload = {
				sub: userId,
				email,
				username,
				role,
			};

			const token = await this.jwtService.signAsync(payload, {
				secret: AUTH_CONSTANTS.JWT_SECRET,
				expiresIn,
			});

			logger.securityLogin('Refresh token generated', {
				userId,
				username,
				role,
				expiresIn,
			});

			return token;
		} catch (error) {
			logger.securityError('Failed to generate refresh token', {
				userId,
				username,
				error: getErrorMessage(error),
			});
			throw createServerError('generate refresh token', error);
		}
	}

	/**
	 * Generate token pair (access + refresh)
	 */
	async generateTokenPair(
		userId: string,
		username: string,
		email: string,
		role: UserRole,
		accessExpiresIn: string = '1h',
		refreshExpiresIn: string = '7d'
	): Promise<TokenPair> {
		try {
			const [accessToken, refreshToken] = await Promise.all([
				this.generateAccessToken(userId, username, email, role, accessExpiresIn),
				this.generateRefreshToken(userId, username, email, role, refreshExpiresIn),
			]);

			logger.securityLogin('Token pair generated', {
				userId,
				username,
				role,
			});

			return {
				accessToken,
				refreshToken,
			};
		} catch (error) {
			logger.securityError('Failed to generate token pair', {
				userId,
				username,
				error: getErrorMessage(error),
			});
			throw createServerError('generate token pair', error);
		}
	}

	/**
	 * Verify and decode token
	 */
	async verifyToken(token: string): Promise<TokenValidationResult> {
		try {
			const payload: TokenPayload = await this.jwtService.verifyAsync<TokenPayload>(token, {
				secret: AUTH_CONSTANTS.JWT_SECRET,
			});

			logger.securityLogin('Token verified successfully', {
				userId: payload.sub,
				username: payload.username,
			});

			return {
				isValid: true,
				payload: payload,
			};
		} catch (error) {
			logger.securityDenied('Token verification failed', {
				error: getErrorMessage(error),
			});

			return {
				isValid: false,
				error: getErrorMessage(error),
			};
		}
	}

	/**
	 * Extract token from request headers
	 */
	extractTokenFromRequest(request: AuthenticationRequest): string | null {
		try {
			// Check Authorization header
			const authHeader = request.headers?.authorization;
			if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
				return authHeader.substring(7);
			}

			// Check cookies
			const cookieToken = request.cookies?.auth_token;
			if (cookieToken) {
				return cookieToken;
			}

			// Check if token is already extracted by middleware
			if (request.authToken) {
				return request.authToken;
			}

			return null;
		} catch (error) {
			logger.securityError('Failed to extract token from request', {
				error: getErrorMessage(error),
			});
			return null;
		}
	}

	/**
	 * Get user from token
	 */
	async getUserFromToken(token: string): Promise<TokenPayload | null> {
		const result = await this.verifyToken(token);
		return result.isValid ? result.payload || null : null;
	}

	/**
	 * Check if token is expired
	 */
	isTokenExpired(token: string): boolean {
		try {
			const decoded: JWTDecodedToken | null = this.jwtService.decode<JWTDecodedToken>(token);
			if (!decoded || !decoded.exp) {
				return true;
			}

			const currentTime = Math.floor(Date.now() / 1000);
			return decoded.exp < currentTime;
		} catch (error) {
			logger.securityError('Failed to check token expiration', {
				error: getErrorMessage(error),
			});
			return true;
		}
	}

	/**
	 * Get token expiration time
	 */
	getTokenExpiration(token: string): Date | null {
		try {
			const decoded: JWTDecodedToken | null = this.jwtService.decode<JWTDecodedToken>(token);
			if (!decoded || !decoded.exp) {
				return null;
			}

			return new Date(decoded.exp * 1000);
		} catch (error) {
			logger.securityError('Failed to get token expiration', {
				error: getErrorMessage(error),
			});
			return null;
		}
	}

	/**
	 * Generate token for specific user data
	 */
	async generateTokenForUser(user: BasicUser): Promise<TokenPair> {
		return this.generateTokenPair(user.id, user.username, user.email, user.role);
	}
}
