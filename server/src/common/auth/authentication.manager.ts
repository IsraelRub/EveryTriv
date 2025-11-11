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
			logger.logAuthenticationEnhanced('login', userData.id, credentials.username, {
				context: 'AuthenticationManager',
			});

			// Check if user is active
			if (!userData.isActive) {
				logger.logSecurityEventEnhanced('User account is inactive', 'warn', {
					username: credentials.username,
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
					username: credentials.username,
					userId: userData.id,
				});
				return {
					error: 'Invalid credentials',
				};
			}

			// Generate tokens
			const tokenPair = await this.jwtTokenService.generateTokenPair(
				userData.id,
				userData.username,
				userData.email,
				userData.role
			);

			logger.logAuthenticationEnhanced('login', userData.id, credentials.username, {
				success: true,
				role: userData.role,
				context: 'AuthenticationManager',
			});

			return {
				user: {
					id: userData.id,
					username: userData.username,
					email: userData.email,
					role: userData.role,
				},
				accessToken: tokenPair.accessToken,
				refreshToken: tokenPair.refreshToken,
				message: 'Authentication successful',
			};
		} catch (error) {
			logger.securityError('Authentication failed', {
				username: credentials.username,
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
			const newAccessToken = await this.jwtTokenService.generateAccessToken(
				payload.sub,
				payload.username,
				payload.email,
				payload.role
			);

			logger.securityLogin('Token refresh successful', {
				userId: payload.sub,
				username: payload.username,
			});

			return {
				user: {
					id: payload.sub,
					username: payload.username,
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
		username: string;
		email: string;
		role: UserRole;
	}): Promise<{ accessToken: string; refreshToken: string }> {
		return await this.jwtTokenService.generateTokenForUser(user);
	}

	/**
	 * Logout user (invalidate tokens)
	 */
	async logout(userId: string, username: string): Promise<void> {
		logger.securityLogin('User logout', {
			userId,
			username,
		});
	}
}
