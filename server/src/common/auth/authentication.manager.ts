/**
 * Authentication Manager - Centralized authentication logic
 *
 * @module AuthenticationManager
 * @description Unified authentication service that consolidates all authentication logic
 * @author EveryTriv Team
 */
import { Injectable } from '@nestjs/common';
import { AuthenticationConfig, AuthenticationRequest, AuthenticationResult, LoginCredentials, serverLogger as logger , TokenPayload , UserData } from '@shared';

import { JwtTokenService } from './jwt-token.service';
import { PasswordService } from './password.service';

@Injectable()
export class AuthenticationManager {
	private readonly config: AuthenticationConfig = {
		enableRefreshTokens: true,
		accessTokenExpiry: '1h',
		refreshTokenExpiry: '7d',
		requireEmailVerification: false,
		requirePhoneVerification: false,
	};

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
					success: false,
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
					success: false,
					error: 'Invalid credentials',
				};
			}

			// Generate tokens
			const tokenPair = await this.jwtTokenService.generateTokenPair(
				userData.id,
				userData.username,
				userData.email,
				userData.role,
				this.config.accessTokenExpiry,
				this.config.refreshTokenExpiry
			);

			logger.logAuthenticationEnhanced('login', userData.id, credentials.username, {
				success: true,
				role: userData.role,
				context: 'AuthenticationManager',
			});

			return {
				success: true,
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
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return {
				success: false,
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
					success: false,
					error: 'Invalid refresh token',
				};
			}

			const payload = tokenResult.payload;

			// Generate new access token
			const newAccessToken = await this.jwtTokenService.generateAccessToken(
				payload.sub,
				payload.username,
				payload.email,
				payload.role,
				this.config.accessTokenExpiry
			);

			logger.securityLogin('Token refresh successful', {
				userId: payload.sub,
				username: payload.username,
			});

			return {
				success: true,
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
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return {
				success: false,
				error: 'Token refresh failed',
			};
		}
	}

	/**
	 * Validate token and get user
	 */
	async validateToken(token: string): Promise<AuthenticationResult> {
		try {
			const tokenResult = await this.jwtTokenService.verifyToken(token);
			if (!tokenResult.isValid || !tokenResult.payload) {
				return {
					success: false,
					error: 'Invalid token',
				};
			}

			const payload = tokenResult.payload;
			return {
				success: true,
				user: {
					id: payload.sub,
					username: payload.username,
					email: payload.email,
					role: payload.role,
				},
				message: 'Token is valid',
			};
		} catch (error) {
			logger.securityError('Token validation failed', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return {
				success: false,
				error: 'Token validation failed',
			};
		}
	}

	/**
	 * Extract user from request
	 */
	async getUserFromRequest(request: AuthenticationRequest): Promise<TokenPayload | null> {
		try {
			const token = this.jwtTokenService.extractTokenFromRequest(request);
			if (!token) {
				return null;
			}

			return await this.jwtTokenService.getUserFromToken(token);
		} catch (error) {
			logger.securityError('Failed to extract user from request', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return null;
		}
	}

	/**
	 * Hash password for user
	 */
	async hashUserPassword(password: string): Promise<string> {
		return await this.passwordService.hashPassword(password);
	}

	/**
	 * Validate password strength
	 */
	validateUserPassword(password: string): { isValid: boolean; errors: string[]; strength?: string } {
		const result = this.passwordService.validatePasswordStrength(password);
		return {
			isValid: result.isValid,
			errors: result.errors,
			strength: result.strength,
		};
	}

	/**
	 * Generate tokens for user
	 */
	async generateTokensForUser(user: {
		id: string;
		username: string;
		email: string;
		role: string;
	}): Promise<{ accessToken: string; refreshToken: string }> {
		return await this.jwtTokenService.generateTokenForUser(user);
	}

	/**
	 * Check if user has required role
	 */
	hasRole(user: TokenPayload, requiredRole: string): boolean {
		return user.role === requiredRole || user.role === 'admin';
	}

	/**
	 * Check if user has any of the required roles
	 */
	hasAnyRole(user: TokenPayload, requiredRoles: string[]): boolean {
		return requiredRoles.includes(user.role) || user.role === 'admin';
	}

	/**
	 * Check if user is admin
	 */
	isAdmin(user: TokenPayload): boolean {
		return user.role === 'admin';
	}

	/**
	 * Check if user is the owner of a resource
	 */
	isOwner(user: TokenPayload, resourceOwnerId: string): boolean {
		return user.sub === resourceOwnerId;
	}

	/**
	 * Check if user can access resource (owner or admin)
	 */
	canAccessResource(user: TokenPayload, resourceOwnerId: string): boolean {
		return this.isOwner(user, resourceOwnerId) || this.isAdmin(user);
	}

	/**
	 * Logout user (invalidate tokens)
	 */
	async logout(userId: string, username: string): Promise<void> {
		logger.securityLogin('User logout', {
			userId,
			username,
		});
		// In a real implementation, you might want to blacklist tokens
		// or store logout events in a database
	}

	/**
	 * Update authentication configuration
	 */
	updateConfig(newConfig: Partial<AuthenticationConfig>): void {
		Object.assign(this.config, newConfig);
		logger.securityLogin('Authentication configuration updated', {
			config: this.config,
		});
	}
}
