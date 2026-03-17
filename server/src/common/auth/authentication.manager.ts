import { Injectable } from '@nestjs/common';

import { ErrorCode } from '@shared/constants';
import type { AuthCredentials, AuthenticationResult } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';
import type { UserData } from '@internal/types';

import { JwtTokenService } from './jwt-token.service';
import { PasswordService } from './password.service';

@Injectable()
export class AuthenticationManager {
	constructor(
		private readonly jwtTokenService: JwtTokenService,
		private readonly passwordService: PasswordService
	) {}

	async authenticate(credentials: AuthCredentials, userData: UserData): Promise<AuthenticationResult> {
		try {
			// Check if user is active
			if (!userData.isActive) {
				logger.securityDenied('User account is inactive', {
					emails: { current: credentials.email },
					userId: userData.id,
				});
				return {
					error: ErrorCode.ACCOUNT_IS_INACTIVE,
				};
			}

			// Verify password
			const isPasswordValid = await this.passwordService.comparePassword(credentials.password, userData.passwordHash);

			if (!isPasswordValid) {
				logger.securityDenied('Password verification failed', {
					emails: { current: credentials.email },
					userId: userData.id,
					contextMessage: 'password_mismatch',
				});
				return {
					error: ErrorCode.INVALID_CREDENTIALS,
				};
			}

			// Generate tokens
			let tokenPair;
			try {
				tokenPair = await this.jwtTokenService.generateTokenPair(userData.id, userData.email, userData.role);
			} catch (tokenError) {
				logger.securityError('Token generation failed', {
					emails: { current: credentials.email },
					userId: userData.id,
					errorInfo: { message: getErrorMessage(tokenError) },
				});
				return {
					error: ErrorCode.TOKEN_GENERATION_FAILED,
				};
			}

			logger.securityLogin('Authentication: login', {
				userId: userData.id,
				emails: { current: credentials.email },
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
				emails: { current: credentials.email },
				errorInfo: { message: getErrorMessage(error) },
			});
			return {
				error: ErrorCode.AUTHENTICATION_FAILED_GENERIC,
			};
		}
	}

	async refreshAccessToken(refreshToken: string): Promise<AuthenticationResult> {
		try {
			logger.securityLogin('Token refresh attempt');

			// Verify refresh token
			const tokenResult = await this.jwtTokenService.verifyToken(refreshToken);
			if (!tokenResult.isValid || !tokenResult.payload) {
				logger.securityDenied('Invalid refresh token');
				return {
					error: ErrorCode.INVALID_REFRESH_TOKEN,
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
					emails: { current: payload.email },
					errorInfo: { message: getErrorMessage(tokenError) },
				});
				return {
					error: ErrorCode.TOKEN_GENERATION_FAILED,
				};
			}

			logger.securityLogin('Token refresh successful', {
				userId: payload.sub,
				emails: { current: payload.email },
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
				errorInfo: { message: getErrorMessage(error) },
			});
			return {
				error: ErrorCode.TOKEN_REFRESH_FAILED,
			};
		}
	}
}
