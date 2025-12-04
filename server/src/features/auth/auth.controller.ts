/**
 * Auth Controller
 *
 * @module AuthController
 * @description Authentication controller with login, register, and user management endpoints
 */
import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

import { CACHE_DURATION, LOCALHOST_URLS, UserRole } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { AdminUserData, BasicUser, GoogleAuthRequest, TokenPayload } from '@shared/types';
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
	 * @param registerDto User registration data
	 * @returns Authentication response with user data and tokens
	 */
	@Post('register')
	@Public()
	async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
		try {
			logger.authRegister('User registration attempt', {
				email: registerDto.email,
			});

			const result = await this.authService.register(registerDto);

			logger.authRegister('User registered successfully', {
				userId: result.user.id,
				email: result.user.email,
			});

			return result;
		} catch (error) {
			logger.authError('User registration failed', {
				error: getErrorMessage(error),
				email: registerDto.email,
			});
			throw error;
		}
	}

	/**
	 * Login user
	 * @param loginDto User login credentials (email)
	 * @returns Authentication response with user data and tokens
	 */
	@Post('login')
	@Public()
	async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
		try {
			logger.securityLogin('User login attempt', {
				email: loginDto.email,
			});

			const result = await this.authService.login(loginDto);

			logger.securityLogin('User logged in successfully', {
				userId: result.user.id,
				email: result.user.email,
			});

			return result;
		} catch (error) {
			logger.authError('User login failed', {
				error: getErrorMessage(error),
				email: loginDto.email,
			});
			throw error;
		}
	}

	/**
	 * Refresh access token
	 * @param refreshTokenDto Refresh token data
	 * @returns New token pair with access and refresh tokens
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
	 * @param user Current user token payload
	 * @returns Current user data with full profile information
	 */
	@Get('me')
	@NoCache()
	async getCurrentUser(
		@CurrentUser() user: TokenPayload
	): Promise<BasicUser & { firstName?: string; lastName?: string }> {
		try {
			logger.authInfo('Current user accessed', {
				userId: user.sub,
			});

			// Get full user data from database (includes firstName, lastName, etc.)
			const fullUser = await this.authService.getCurrentUser(user.sub);

			// Return user data with firstName and lastName
			const userData: BasicUser & { firstName?: string; lastName?: string } = {
				id: fullUser.id,
				email: fullUser.email,
				role: fullUser.role,
			};

			// Add firstName and lastName if they exist
			const userWithName = fullUser as { firstName?: string; lastName?: string };
			if (userWithName.firstName) {
				userData.firstName = userWithName.firstName;
			}
			if (userWithName.lastName) {
				userData.lastName = userWithName.lastName;
			}

			logger.systemInfo('Returning user data', {
				userId: userData.id,
				data: {
					hasFirstName: !!userData.firstName,
					hasLastName: !!userData.lastName,
				},
			});

			return userData;
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
	 * @param userId Current user identifier
	 * @returns Logout confirmation message
	 */
	@Post('logout')
	async logout(@CurrentUserId() userId: string): Promise<{ message: string }> {
		try {
			const result = await this.authService.logout(userId);

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
	 * Initiates Google OAuth authentication flow
	 */
	@Get('google')
	@Public()
	@UseGuards(PassportAuthGuard('google'))
	async googleLogin() {
		logger.authInfo('Google OAuth guard initiated');
	}

	/**
	 * Google OAuth callback
	 * Handles Google OAuth callback and authenticates user
	 * @param req Google authentication request with user profile
	 * @param res Express response object for redirects
	 * @returns Authentication response with user data and tokens or redirects on error
	 */
	@Get('google/callback')
	@Public()
	@UseGuards(PassportAuthGuard('google'))
	async googleCallback(@Req() req: GoogleAuthRequest, @Res() res: Response) {
		try {
			logger.authInfo('Google OAuth callback requested');

			// Log request details for debugging
			const queryParamsRecord: Record<string, string | string[]> = {};
			if (req.query) {
				for (const [key, value] of Object.entries(req.query)) {
					if (typeof value === 'string') {
						queryParamsRecord[key] = value;
					} else if (Array.isArray(value)) {
						queryParamsRecord[key] = value.map(v => String(v));
					} else if (value !== undefined) {
						queryParamsRecord[key] = String(value);
					}
				}
			}

			logger.systemInfo('Google OAuth callback request details', {
				hasUser: !!req.user,
				userType: typeof req.user,
				userKeys: req.user ? Object.keys(req.user) : [],
				queryParams: queryParamsRecord,
			});

			// Check for OAuth errors from Google (query parameters)
			const error = typeof req.query.error === 'string' ? req.query.error : undefined;
			const errorDescription =
				typeof req.query.error_description === 'string' ? req.query.error_description : undefined;
			const errorUri = typeof req.query.error_uri === 'string' ? req.query.error_uri : undefined;

			if (error) {
				logger.authError('Google OAuth error received', {
					error,
					errorDescription,
					errorUri,
				});

				const clientUrl = process.env.CLIENT_URL || LOCALHOST_URLS.CLIENT;
				const errorParam = error === 'invalid_client' ? 'invalid_client' : 'oauth_failed';
				const redirectUrl = `${clientUrl}/auth/callback?error=${errorParam}&error_description=${encodeURIComponent(errorDescription || error)}`;

				return res.redirect(redirectUrl);
			}

			const payload = req.user;
			logger.systemInfo('Google OAuth callback payload check', {
				hasPayload: !!payload,
				payloadType: typeof payload,
				payloadKeys: payload ? Object.keys(payload) : [],
				hasGoogleId: payload ? 'googleId' in payload : false,
				data: {
					googleIdType: typeof payload?.googleId,
					googleIdLength: payload?.googleId ? String(payload.googleId).length : 0,
				},
			});

			if (!payload || !payload.googleId) {
				logger.authError('Google profile not available in callback', {
					hasPayload: !!payload,
					payloadType: typeof payload,
					payloadKeys: payload ? Object.keys(payload) : [],
					hasGoogleId: payload ? 'googleId' in payload : false,
				});
				const clientUrl = process.env.CLIENT_URL || LOCALHOST_URLS.CLIENT;
				const redirectUrl = `${clientUrl}/auth/callback?error=oauth_failed&error_description=${encodeURIComponent('Google profile not available')}`;

				return res.redirect(redirectUrl);
			}

			const result = await this.authService.loginWithGoogle({
				googleId: payload.googleId,
				email: payload.email,
				firstName: payload.firstName,
				lastName: payload.lastName,
				avatar: payload.avatar,
			});

			logger.authInfo('Google OAuth login successful', {
				userId: result.user.id,
			});

			// Set tokens in cookies (for same-origin requests)
			const clientUrl = process.env.CLIENT_URL || LOCALHOST_URLS.CLIENT;
			const isProduction = process.env.NODE_ENV === 'production';
			const cookieOptions = {
				httpOnly: true,
				secure: isProduction,
				sameSite: 'lax' as const,
				maxAge: 15 * 60 * 1000, // 15 minutes
				path: '/',
			};

			res.cookie('access_token', result.access_token, cookieOptions);

			if (result.refresh_token) {
				res.cookie('refresh_token', result.refresh_token, {
					...cookieOptions,
					maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
				});
			}

			// Also send token in query parameter for cross-origin redirect compatibility
			// The client will store it in localStorage
			const redirectUrl = `${clientUrl}/auth/callback?success=true&token=${encodeURIComponent(result.access_token)}`;
			return res.redirect(redirectUrl);
		} catch (error) {
			logger.authError('Google OAuth callback error', {
				error: getErrorMessage(error),
			});

			const clientUrl = process.env.CLIENT_URL || LOCALHOST_URLS.CLIENT;
			const errorMessage = getErrorMessage(error);
			const redirectUrl = `${clientUrl}/auth/callback?error=oauth_failed&error_description=${encodeURIComponent(errorMessage)}`;

			return res.redirect(redirectUrl);
		}
	}

	/**
	 * Admin endpoint - get all users (admin only)
	 * @param user Current admin user token payload
	 * @param limit Optional pagination limit
	 * @param offset Optional pagination offset
	 * @returns List of users with pagination metadata
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
				email: user.email,
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
