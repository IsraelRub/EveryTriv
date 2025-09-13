/**
 * Auth Controller
 *
 * @module AuthController
 * @description Authentication controller with login, register, and user management endpoints
 */
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { serverLogger as logger , UsersListResponse } from '@shared';

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
		logger.authRegister('User registration attempt', {
			username: registerDto.username,
			email: registerDto.email,
			ip,
			userAgent,
		});

		const result = await this.authService.register(registerDto);

		logger.authRegister('User registered successfully', {
			userId: result.data.user.id,
			username: result.data.user.username,
			ip,
			userAgent,
		});

		return result;
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
		logger.securityLogin('User login attempt', {
			username: loginDto.username,
			ip,
			userAgent,
		});

		const result = await this.authService.login(loginDto);

		logger.logUserActivity(result.data.user.id, 'login', {
			username: loginDto.username,
		});

		return result;
	}

	/**
	 * Refresh access token
	 */
	@Post('refresh')
	@Public()
	@RateLimit(10, 60) // 10 refresh attempts per minute
	async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
		logger.authTokenRefresh('Token refresh attempt');

		const result = await this.authService.refreshToken(refreshTokenDto);

		logger.authTokenRefresh('Token refreshed successfully');

		return result;
	}

	/**
	 * Get current user profile
	 */
	@Get('me')
	@Cache(300) // Cache for 5 minutes
	@ApiResponse(200, 'User profile retrieved successfully')
	async getCurrentUser(
		@CurrentUser() user: { id: string; username: string; email: string }
	): Promise<{ id: string; username: string; email: string }> {
		logger.apiRead('user_profile', {
			userId: user.id,
		});

		return user;
	}

	/**
	 * Logout user
	 */
	@Post('logout')
	async logout(@CurrentUserId() userId: string): Promise<{ success: boolean; message: string }> {
		const result = await this.authService.logout(userId, 'manual');

		logger.authLogout('User logged out', {
			userId,
		});

		return result;
	}

	/**
	 * Google OAuth login
	 */
	@Get('google')
	async googleLogin(): Promise<{ message: string; status: string; timestamp: string }> {
		logger.apiInfo('Google OAuth login requested');

		// This would redirect to Google OAuth
		return {
			message: 'Google OAuth login not implemented yet',
			status: 'not_implemented',
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Google OAuth callback
	 */
	@Get('google/callback')
	async googleCallback(): Promise<{ message: string; status: string; timestamp: string }> {
		logger.apiInfo('Google OAuth callback requested');

		// This would handle Google OAuth callback
		return {
			message: 'Google OAuth callback not implemented yet',
			status: 'not_implemented',
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Admin endpoint - get all users (admin only)
	 */
	@Get('admin/users')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles('admin', 'super-admin')
	async getAllUsers(@CurrentUser() user: { id: string; role: string; username: string }): Promise<UsersListResponse> {
		try {
			logger.apiRead('admin_get_all_users', {
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
				success: true,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.userError('Failed to get all users', {
				error: error instanceof Error ? error.message : 'Unknown error',
				adminId: user.id,
			});
			throw error;
		}
	}
}
