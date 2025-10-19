/**
 * Auth Controller
 *
 * @module AuthController
 * @description Authentication controller with login, register, and user management endpoints
 */
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { serverLogger as logger } from '@shared/services';
import type { BasicUser } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { UserRole, CACHE_DURATION } from '@shared/constants';

import {
	ApiResponse,
	AuthGuard,
	Cache,
	ClientIP,
	CurrentUser,
	CurrentUserId,
	Public,
	RateLimit,
	Roles,
	RolesGuard,
	UserAgent,
} from '../../common';
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
	@RateLimit(3, 300) // 3 registrations per 5 minutes
	@ApiResponse(201, 'User registered successfully')
	async register(
		@Body() registerDto: RegisterDto,
		@ClientIP() ip: string,
		@UserAgent() userAgent: string
	): Promise<AuthResponseDto> {
		try {
			logger.authRegister('User registration attempt', {
				username: registerDto.username,
				email: registerDto.email,
				ip,
				userAgent,
			});

			const result = await this.authService.register(registerDto);

			logger.authRegister('User registered successfully', {
				userId: result.user.id,
				username: result.user.username,
				ip,
				userAgent,
			});

			return result;
		} catch (error) {
			logger.authError('User registration failed', {
				error: getErrorMessage(error),
				username: registerDto.username,
				email: registerDto.email,
				ip,
			});
			throw error;
		}
	}

	/**
	 * Login user
	 */
	@Post('login')
	@Public()
	@RateLimit(5, 60) // 5 login attempts per minute
	@ApiResponse(200, 'User logged in successfully')
	async login(
		@Body() loginDto: LoginDto,
		@ClientIP() ip: string,
		@UserAgent() userAgent: string
	): Promise<AuthResponseDto> {
		try {
			logger.securityLogin('User login attempt', {
				username: loginDto.username,
				ip,
				userAgent,
			});

			const result = await this.authService.login(loginDto);

			logger.securityLogin('User logged in successfully', {
				userId: result.user.id,
				username: result.user.username,
				ip,
				userAgent,
			});

			return result;
		} catch (error) {
			logger.authError('User login failed', {
				error: getErrorMessage(error),
				username: loginDto.username,
				ip,
			});
			throw error;
		}
	}

	/**
	 * Refresh access token
	 */
	@Post('refresh')
	@Public()
	@RateLimit(10, 60) // 10 refresh attempts per minute
	async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
		try {
			logger.authTokenRefresh('Token refresh attempt');

			const result = await this.authService.refreshToken(refreshTokenDto);

			logger.authTokenRefresh('Token refreshed successfully');

			return result;
		} catch (error) {
			logger.authError('Token refresh failed', {
				error: getErrorMessage(error),
				tokenId: refreshTokenDto.refreshToken?.substring(0, 10) + '...',
			});
			throw error;
		}
	}

	/**
	 * Get current user profile
	 */
	@Get('me')
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	@ApiResponse(200, 'User profile retrieved successfully')
	async getCurrentUser(
		@CurrentUser() user: BasicUser
	): Promise<BasicUser> {
		try {
			logger.authInfo('Current user accessed', {
				userId: user.id,
			});

			return user;
		} catch (error) {
			logger.authError('Error getting current user', {
				error: getErrorMessage(error),
				userId: user.id,
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
	async getAllUsers(@CurrentUser() user: BasicUser) {
		try {
			logger.authInfo('Admin accessed all users', {
				adminId: user.id,
				adminRole: user.role,
			});

			return {
				message: 'Admin access granted',
				adminUser: {
					id: user.id,
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
				adminId: user.id,
				adminRole: user.role,
			});
			throw error;
		}
	}
}
