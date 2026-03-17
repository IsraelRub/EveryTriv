import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserRole } from '@shared/constants';
import type { TokenPair } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { AppConfig } from '@config';
import { serverLogger as logger } from '@internal/services';
import type { TokenPayload, TokenValidationResult } from '@internal/types';
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

	private async generateRefreshToken(
		userId: string,
		email: string,
		role: UserRole,
		expiresIn: string = '7d'
	): Promise<string> {
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
}
