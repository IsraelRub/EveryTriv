/**
 * Auth Controller
 *
 * @module AuthController
 * @description Authentication controller with login, register, and user management endpoints
 */
import { Body, Controller, Get, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

import { CACHE_DURATION, UserRole } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { AdminUserData, GoogleAuthRequest, TokenPayload } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import {
	Cache,
	CurrentUser,
	CurrentUserId,
	AuthGuard as LocalAuthGuard,
	NoCache,
	Public,
	Roles,
	RolesGuard,
} from '../../common';
import { UserService } from '../user';
import { AuthService } from './auth.service';
import { AuthResponseDto, LoginDto, RefreshTokenDto, RefreshTokenResponseDto, RegisterDto } from './dtos/auth.dto';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService
	) {}

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
	@UseGuards(PassportAuthGuard('google'))
	async googleLogin() {
		logger.authInfo('Google OAuth guard initiated');
	}

	/**
	 * Google OAuth callback
	 */
	@Get('google/callback')
	@Public()
	@UseGuards(PassportAuthGuard('google'))
	async googleCallback(@Req() req: GoogleAuthRequest) {
		try {
			logger.authInfo('Google OAuth callback requested');

			const payload = req.user;
			if (!payload || !payload.google_id) {
				throw new UnauthorizedException('Google profile not available');
			}

			const result = await this.authService.loginWithGoogle({
				googleId: payload.google_id,
				email: payload.email,
				username: payload.username,
				firstName: payload.firstName,
				lastName: payload.lastName,
				avatar: payload.avatar,
			});

			logger.authInfo('Google OAuth login successful', {
				userId: result.user.id,
			});

			return result;
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
	@UseGuards(LocalAuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getAllUsers(
		@CurrentUser() user: TokenPayload,
		@Query('limit') limit?: number,
		@Query('offset') offset?: number
	) {
		try {
			logger.authInfo('Admin accessed all users', {
				id: user.sub,
				role: user.role,
			});

			const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
			const parsedOffset = typeof offset === 'string' ? parseInt(offset, 10) : offset;
			const result = await this.userService.getAllUsers(parsedLimit, parsedOffset);

			const adminUser: AdminUserData = {
				id: user.sub,
				username: user.username,
				email: user.email ?? `${user.username}@everytriv.com`,
				role: user.role,
				createdAt: new Date().toISOString(),
				lastLogin: undefined,
			};

			return {
				success: true,
				message: 'Users retrieved successfully',
				adminUser,
				users: result.users,
				pagination: {
					total: result.total,
					limit: result.limit,
					offset: result.offset,
				},
				timestamp: new Date().toISOString(),
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
