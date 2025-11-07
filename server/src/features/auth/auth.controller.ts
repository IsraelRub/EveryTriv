/**
 * Auth Controller
 *
 * @module AuthController
 * @description Authentication controller with login, register, and user management endpoints
 */
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CACHE_DURATION, UserRole } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { TokenPayload } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { AuthGuard, Cache, CurrentUser, CurrentUserId, NoCache, Public, Roles, RolesGuard } from '../../common';
import { AuthService } from './auth.service';
import { AuthResponseDto, LoginDto, RefreshTokenDto, RefreshTokenResponseDto, RegisterDto } from './dtos/auth.dto';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	/**
	 * Register a new user
	 */
	@Post('register')
	@Public()
	async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
		try {
			logger.authRegister('User registration attempt', {
				username: registerDto.username,
				email: registerDto.email,
			});

			const result = await this.authService.register(registerDto);

			logger.authRegister('User registered successfully', {
				userId: result.user.id,
				username: result.user.username,
			});

			return result;
		} catch (error) {
			logger.authError('User registration failed', {
				error: getErrorMessage(error),
				username: registerDto.username,
				email: registerDto.email,
			});
			throw error;
		}
	}

	/**
	 * Login user
	 */
	@Post('login')
	@Public()
	async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
		try {
			logger.securityLogin('User login attempt', {
				username: loginDto.username,
			});

			const result = await this.authService.login(loginDto);

			logger.securityLogin('User logged in successfully', {
				userId: result.user.id,
				username: result.user.username,
			});

			return result;
		} catch (error) {
			logger.authError('User login failed', {
				error: getErrorMessage(error),
				username: loginDto.username,
			});
			throw error;
		}
	}

	/**
	 * Refresh access token
	 */
	@Post('refresh')
	@Public()
	async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
		try {
			logger.authTokenRefresh('Token refresh attempt');

			const result = await this.authService.refreshToken(refreshTokenDto);

			logger.authTokenRefresh('Token refreshed successfully');

			return result;
		} catch (error) {
			logger.authError('Token refresh failed', {
				error: getErrorMessage(error),
				id: refreshTokenDto.refreshToken?.substring(0, 10) + '...',
			});
			throw error;
		}
	}

	/**
	 * Get current user profile
	 */
	@Get('me')
	@NoCache()
	async getCurrentUser(@CurrentUser() user: TokenPayload): Promise<TokenPayload> {
		try {
			logger.authInfo('Current user accessed', {
				userId: user.sub,
			});

			return user;
		} catch (error) {
			logger.authError('Error getting current user', {
				error: getErrorMessage(error),
				userId: user.sub,
			});
			throw error;
		}
	}

	/**
	 * Logout user
	 */
	@Post('logout')
	async logout(@CurrentUserId() userId: string): Promise<{ message: string }> {
		try {
			const result = await this.authService.logout(userId, 'manual');

			logger.authLogout('User logged out', {
				userId,
			});

			return result;
		} catch (error) {
			logger.authError('User logout failed', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Google OAuth login
	 */
	@Get('google')
	@Public()
	async googleLogin() {
		try {
			logger.authInfo('Google OAuth login requested');

			// This would redirect to Google OAuth
			return {
				status: 'not_implemented',
				reason: 'Google OAuth login not implemented yet',
			};
		} catch (error) {
			logger.authError('Google OAuth login error', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Google OAuth callback
	 */
	@Get('google/callback')
	@Public()
	async googleCallback(): Promise<{ message: string; status: string }> {
		try {
			logger.authInfo('Google OAuth callback requested');

			// This would handle Google OAuth callback
			return {
				message: 'Google OAuth callback not implemented yet',
				status: 'not_implemented',
			};
		} catch (error) {
			logger.authError('Google OAuth callback error', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - get all users (admin only)
	 */
	@Get('admin/users')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getAllUsers(@CurrentUser() user: TokenPayload) {
		try {
			logger.authInfo('Admin accessed all users', {
				id: user.sub,
				role: user.role,
			});

			return {
				message: 'Admin access granted',
				adminUser: {
					id: user.sub,
					username: user.username,
					email: user.username + '@example.com', // Default email
					role: user.role,
					createdAt: new Date().toISOString(),
				},
				users: [],
			};
		} catch (error) {
			logger.authError('Failed to get all users', {
				error: getErrorMessage(error),
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}
}
