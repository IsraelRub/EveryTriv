/**
 * Authentication Manager - Centralized authentication logic
 *
 * @module AuthenticationManager
 * @description authentication service that consolidates all authentication logic
 * @author EveryTriv Team
 */
import { Injectable } from '@nestjs/common';

import { UserRole } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { AuthenticationResult, LoginCredentials, UserData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { JwtTokenService } from './jwt-token.service';
import { PasswordService } from './password.service';

@Injectable()
export class AuthenticationManager {
	constructor(
		private readonly jwtTokenService: JwtTokenService,
		private readonly passwordService: PasswordService
	) {}

	/**
	 * Authenticate user with credentials
	 */
	async authenticate(credentials: LoginCredentials, userData: UserData): Promise<AuthenticationResult> {
		try {
			// Use enhanced logging
			logger.logAuthenticationEnhanced('login', userData.id, credentials.email, {
				context: 'AuthenticationManager',
			});

			// Check if user is active
			if (!userData.isActive) {
				logger.logSecurityEventEnhanced('User account is inactive', 'warn', {
					email: credentials.email,
					userId: userData.id,
				});
				return {
					error: 'Account is inactive',
				};
			}

			// Verify password
			const isPasswordValid = await this.passwordService.comparePassword(credentials.password, userData.passwordHash);

			if (!isPasswordValid) {
				logger.logSecurityEventEnhanced('Invalid password', 'warn', {
					email: credentials.email,
					userId: userData.id,
				});
				return {
					error: 'Invalid credentials',
				};
			}

			// Generate tokens
			let tokenPair;
			try {
				tokenPair = await this.jwtTokenService.generateTokenPair(userData.id, userData.email, userData.role);
			} catch (tokenError) {
				logger.securityError('Token generation failed', {
					email: credentials.email,
					userId: userData.id,
					error: getErrorMessage(tokenError),
				});
				return {
					error: 'Token generation failed',
				};
			}

			logger.logAuthenticationEnhanced('login', userData.id, credentials.email, {
				success: true,
				role: userData.role,
				context: 'AuthenticationManager',
			});

			return {
				user: {
					id: userData.id,
					email: userData.email,
					role: userData.role,
				},
				accessToken: tokenPair.accessToken,
				refreshToken: tokenPair.refreshToken,
				message: 'Authentication successful',
			};
		} catch (error) {
			logger.securityError('Authentication failed', {
				email: credentials.email,
				error: getErrorMessage(error),
			});
			return {
				error: 'Authentication failed',
			};
		}
	}

	/**
	 * Refresh access token
	 */
	async refreshAccessToken(refreshToken: string): Promise<AuthenticationResult> {
		try {
			logger.securityLogin('Token refresh attempt');

			// Verify refresh token
			const tokenResult = await this.jwtTokenService.verifyToken(refreshToken);
			if (!tokenResult.isValid || !tokenResult.payload) {
				logger.securityDenied('Invalid refresh token');
				return {
					error: 'Invalid refresh token',
				};
			}

			const payload = tokenResult.payload;

			// Generate new access token
			let newAccessToken;
			try {
				newAccessToken = await this.jwtTokenService.generateAccessToken(payload.sub, payload.email, payload.role);
			} catch (tokenError) {
				logger.securityError('Token generation failed during refresh', {
					userId: payload.sub,
					email: payload.email,
					error: getErrorMessage(tokenError),
				});
				return {
					error: 'Token generation failed',
				};
			}

			logger.securityLogin('Token refresh successful', {
				userId: payload.sub,
				email: payload.email,
			});

			return {
				user: {
					id: payload.sub,
					email: payload.email,
					role: payload.role,
				},
				accessToken: newAccessToken,
				message: 'Token refreshed successfully',
			};
		} catch (error) {
			logger.securityError('Token refresh failed', {
				error: getErrorMessage(error),
			});
			return {
				error: 'Token refresh failed',
			};
		}
	}

	/**
	 * Generate tokens for user
	 */
	async generateTokensForUser(user: {
		id: string;
		email: string;
		role: UserRole;
	}): Promise<{ accessToken: string; refreshToken: string }> {
		return await this.jwtTokenService.generateTokenForUser(user);
	}

	/**
	 * Logout user (invalidate tokens)
	 */
	async logout(userId: string): Promise<void> {
		logger.securityLogin('User logout', {
			userId,
		});
	}
}
