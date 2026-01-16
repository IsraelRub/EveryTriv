import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserRole } from '@shared/constants';
import type { AuthenticationRequest, TokenPair, TokenPayload, TokenValidationResult } from '@shared/types';
import { getCurrentTimestampInSeconds, getErrorMessage } from '@shared/utils';

import { AppConfig } from '@config';
import { serverLogger as logger } from '@internal/services';
import { createServerError } from '@internal/utils';

@Injectable()
export class JwtTokenService {
	constructor(private readonly jwtService: JwtService) {}

	async generateAccessToken(userId: string, email: string, role: UserRole, expiresIn: string = '1h'): Promise<string> {
		try {
			const payload: TokenPayload = {
				sub: userId,
				email,
				role,
			};

			const token = await this.jwtService.signAsync(payload, {
				secret: AppConfig.jwt.secret,
				expiresIn,
			});

			logger.securityLogin('Access token generated', {
				userId,
				emails: { current: email },
				role,
				expiresIn,
			});

			return token;
		} catch (error) {
			logger.securityError('Failed to generate access token', {
				userId,
				emails: { current: email },
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createServerError('generate access token', error);
		}
	}

	async generateRefreshToken(userId: string, email: string, role: UserRole, expiresIn: string = '7d'): Promise<string> {
		try {
			const payload: TokenPayload = {
				sub: userId,
				email,
				role,
			};

			const token = await this.jwtService.signAsync(payload, {
				secret: AppConfig.jwt.secret,
				expiresIn,
			});

			logger.securityLogin('Refresh token generated', {
				userId,
				emails: { current: email },
				role,
				expiresIn,
			});

			return token;
		} catch (error) {
			logger.securityError('Failed to generate refresh token', {
				userId,
				emails: { current: email },
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createServerError('generate refresh token', error);
		}
	}

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
				emails: { current: email },
				role,
			});

			return {
				accessToken,
				refreshToken,
			};
		} catch (error) {
			logger.securityError('Failed to generate token pair', {
				userId,
				emails: { current: email },
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createServerError('generate token pair', error);
		}
	}

	async verifyToken(token: string): Promise<TokenValidationResult> {
		try {
			const payload: TokenPayload = await this.jwtService.verifyAsync<TokenPayload>(token, {
				secret: AppConfig.jwt.secret,
			});

			logger.securityLogin('Token verified successfully', {
				userId: payload.sub,
				emails: { current: payload.email },
			});

			return {
				isValid: true,
				payload: payload,
			};
		} catch (error) {
			logger.securityDenied('Token verification failed', {
				errorInfo: { message: getErrorMessage(error) },
			});

			return {
				isValid: false,
				error: getErrorMessage(error),
			};
		}
	}

	extractTokenFromRequest(request: AuthenticationRequest): string | null {
		try {
			// Check Authorization header
			const authHeader = request.headers?.authorization;
			if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
				return authHeader.substring(7);
			}

			// Check cookies for access token
			const cookieToken = request.cookies?.access_token;
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
				errorInfo: { message: getErrorMessage(error) },
			});
			return null;
		}
	}

	async getUserFromToken(token: string): Promise<TokenPayload | null> {
		const result = await this.verifyToken(token);
		return result.isValid ? (result.payload ?? null) : null;
	}

	isTokenExpired(token: string): boolean {
		try {
			const decoded: TokenPayload | null = this.jwtService.decode<TokenPayload>(token);
			if (!decoded?.exp) {
				return true;
			}

			const currentTime = getCurrentTimestampInSeconds();
			return decoded.exp < currentTime;
		} catch (error) {
			logger.securityError('Failed to check token expiration', {
				errorInfo: { message: getErrorMessage(error) },
			});
			return true;
		}
	}

	getTokenExpiration(token: string): Date | null {
		try {
			const decoded: TokenPayload | null = this.jwtService.decode<TokenPayload>(token);
			if (!decoded?.exp) {
				return null;
			}

			return new Date(decoded.exp * 1000);
		} catch (error) {
			logger.securityError('Failed to get token expiration', {
				errorInfo: { message: getErrorMessage(error) },
			});
			return null;
		}
	}
}
