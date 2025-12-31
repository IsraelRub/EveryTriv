/**
 * JWT Token Service - Centralized JWT token management
 *
 * @module JwtTokenService
 * @description JWT token generation and validation service
 */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserRole } from '@shared/constants';
import { getCurrentTimestampInSeconds, getErrorMessage } from '@shared/utils';
import { AUTH_CONSTANTS } from '@shared/constants';
import { serverLogger as logger } from '@internal/services';
import type {
	AuthenticationRequest,
	TokenPair,
	TokenPayload,
	TokenUserData,
	TokenValidationResult,
} from '@internal/types';
import { createServerError } from '@internal/utils';

@Injectable()
export class JwtTokenService {
	constructor(private readonly jwtService: JwtService) {}

	/**
	 * Generate access token
	 */
	async generateAccessToken(userId: string, email: string, role: UserRole, expiresIn: string = '1h'): Promise<string> {
		try {
			const payload: TokenPayload = {
				sub: userId,
				email,
				role,
			};

			const token = await this.jwtService.signAsync(payload, {
				secret: AUTH_CONSTANTS.JWT_SECRET,
				expiresIn,
			});

			logger.securityLogin('Access token generated', {
				userId,
				email,
				role,
				expiresIn,
			});

			return token;
		} catch (error) {
			logger.securityError('Failed to generate access token', {
				userId,
				email,
				error: getErrorMessage(error),
			});
			throw createServerError('generate access token', error);
		}
	}

	/**
	 * Generate refresh token
	 */
	async generateRefreshToken(userId: string, email: string, role: UserRole, expiresIn: string = '7d'): Promise<string> {
		try {
			const payload: TokenPayload = {
				sub: userId,
				email,
				role,
			};

			const token = await this.jwtService.signAsync(payload, {
				secret: AUTH_CONSTANTS.JWT_SECRET,
				expiresIn,
			});

			logger.securityLogin('Refresh token generated', {
				userId,
				email,
				role,
				expiresIn,
			});

			return token;
		} catch (error) {
			logger.securityError('Failed to generate refresh token', {
				userId,
				email,
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
		email: string,
		role: UserRole,
		accessExpiresIn: string = '1h',
		refreshExpiresIn: string = '7d'
	): Promise<TokenPair> {
		try {
			const [accessToken, refreshToken] = await Promise.all([
				this.generateAccessToken(userId, email, role, accessExpiresIn),
				this.generateRefreshToken(userId, email, role, refreshExpiresIn),
			]);

			logger.securityLogin('Token pair generated', {
				userId,
				email,
				role,
			});

			return {
				accessToken,
				refreshToken,
			};
		} catch (error) {
			logger.securityError('Failed to generate token pair', {
				userId,
				email,
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
				email: payload.email,
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

			// Check cookies (support both access_token and auth_token for backward compatibility)
			const cookieToken = request.cookies?.access_token || request.cookies?.auth_token;
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
			const decoded: TokenPayload | null = this.jwtService.decode<TokenPayload>(token);
			if (!decoded || !decoded.exp) {
				return true;
			}

			const currentTime = getCurrentTimestampInSeconds();
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
			const decoded: TokenPayload | null = this.jwtService.decode<TokenPayload>(token);
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
	async generateTokenForUser(user: TokenUserData): Promise<TokenPair> {
		return this.generateTokenPair(user.id, user.email, user.role);
	}
}
