import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

import { API_ENDPOINTS, TIME_DURATIONS_SECONDS, TIME_PERIODS_MS, UserRole, VALIDATORS } from '@shared/constants';
import type { AdminUserData, BasicUser, GoogleAuthRequest, TokenPayload } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { UserCoreService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';

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
import { LOCALHOST_CONFIG } from '../../config/localhost.config';
import { AuthService } from './auth.service';
import { AuthResponseDto, LoginDto, RefreshTokenDto, RefreshTokenResponseDto, RegisterDto } from './dtos/auth.dto';

@Controller(API_ENDPOINTS.AUTH.BASE)
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly userCoreService: UserCoreService
	) {}

	@Post('register')
	@Public()
	async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
		try {
			logger.authRegister('User registration attempt', {
				emails: { current: registerDto.email },
			});

			const result = await this.authService.register(registerDto);

			logger.authRegister('User registered successfully', {
				userId: result.user.id,
				emails: { current: result.user.email },
			});

			return result;
		} catch (error) {
			logger.authError('User registration failed', {
				errorInfo: { message: getErrorMessage(error) },
				emails: { current: registerDto.email },
			});
			throw error;
		}
	}

	@Post('login')
	@Public()
	async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
		try {
			logger.securityLogin('User login attempt', {
				emails: { current: loginDto.email },
			});

			const result = await this.authService.login(loginDto);

			logger.securityLogin('User logged in successfully', {
				userId: result.user.id,
				emails: { current: result.user.email },
			});

			return result;
		} catch (error) {
			logger.authError('User login failed', {
				errorInfo: { message: getErrorMessage(error) },
				emails: { current: loginDto.email },
			});
			throw error;
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
				id: refreshTokenDto.refreshToken?.substring(0, 10) + '...',
			});
			throw error;
		}
	}

	@Get('me')
	@NoCache()
	async getCurrentUser(@CurrentUser() user: TokenPayload): Promise<BasicUser> {
		try {
			logger.authInfo('Current user accessed', {
				userId: user.sub,
				emails: { current: user.email },
				role: user.role,
			});

			logger.authDebug('Fetching user from database', {
				userIds: {
					requested: user.sub,
				},
			});
			const fullUser = await this.authService.getCurrentUser(user.sub);

			logger.authDebug('User fetched from database', {
				userId: fullUser.id,
				emails: { current: fullUser.email },
				role: fullUser.role,
				userIds: {
					requested: user.sub,
				},
				userIdMatches: fullUser.id === user.sub,
			});

			const userData: BasicUser = {
				id: fullUser.id,
				email: fullUser.email,
				role: fullUser.role,
			};

			if ('firstName' in fullUser && VALIDATORS.string(fullUser.firstName) && fullUser.firstName) {
				userData.firstName = fullUser.firstName;
			}
			if ('lastName' in fullUser && VALIDATORS.string(fullUser.lastName) && fullUser.lastName) {
				userData.lastName = fullUser.lastName;
			}
			if (fullUser.preferences?.avatar && VALIDATORS.number(fullUser.preferences.avatar)) {
				userData.avatar = fullUser.preferences.avatar;
			}

			logger.systemInfo('Returning user data', {
				userId: userData.id,
			});

			return userData;
		} catch (error) {
			logger.authError('Error getting current user', {
				errorInfo: { message: getErrorMessage(error) },
				userId: user.sub,
			});
			throw error;
		}
	}

	@Post('logout')
	async logout(@CurrentUserId() userId: string): Promise<string> {
		try {
			const result = await this.authService.logout(userId);

			logger.authLogout('User logged out', {
				userId,
			});

			return result;
		} catch (error) {
			logger.authError('User logout failed', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	// Initiates Google OAuth authentication flow
	@Get('google')
	@Public()
	@UseGuards(PassportAuthGuard('google'))
	async googleLogin() {
		logger.authInfo('Google OAuth guard initiated');
	}

	@Get('google/callback')
	@Public()
	@UseGuards(PassportAuthGuard('google'))
	async googleCallback(@Req() req: GoogleAuthRequest, @Res() res: Response) {
		try {
			logger.authInfo('Google OAuth callback requested');

			const queryParamsRecord: Record<string, string | string[]> = {};
			if (req.query) {
				for (const [key, value] of Object.entries(req.query)) {
					if (VALIDATORS.string(value)) {
						queryParamsRecord[key] = value;
					} else if (Array.isArray(value)) {
						queryParamsRecord[key] = value.map(v => String(v));
					} else if (value !== undefined) {
						queryParamsRecord[key] = String(value);
					}
				}
			}

			logger.systemInfo('Google OAuth callback request details', {
				userKeys: req.user ? Object.keys(req.user) : [],
				queryParams: queryParamsRecord,
			});

			const error = VALIDATORS.string(req.query.error) ? req.query.error : undefined;
			const errorDescription = VALIDATORS.string(req.query.error_description) ? req.query.error_description : undefined;
			const errorUri = VALIDATORS.string(req.query.error_uri) ? req.query.error_uri : undefined;

			if (error) {
				logger.authError('Google OAuth error received', {
					errorInfo: {
						message: error,
						description: errorDescription,
						uri: errorUri,
					},
				});

				const clientUrl = process.env.CLIENT_URL ?? LOCALHOST_CONFIG.urls.CLIENT;
				const errorParam = error === 'invalid_client' ? 'invalid_client' : 'oauth_failed';
				const redirectUrl = `${clientUrl}/auth/callback?error=${errorParam}&error_description=${encodeURIComponent(errorDescription ?? error)}`;

				return res.redirect(redirectUrl);
			}

			const payload = req.user;
			logger.systemInfo('Google OAuth callback payload check', {
				data: {
					googleIdLength: payload?.googleId ? String(payload.googleId).length : 0,
				},
				dataKeys: payload ? Object.keys(payload) : [],
			});

			if (!payload?.googleId || !VALIDATORS.string(payload.googleId)) {
				logger.authError('Google profile not available or invalid in callback', {
					errorInfo: {
						message: payload?.googleId ? `Expected string, got ${typeof payload.googleId}` : 'googleId is missing',
					},
				});
				const clientUrl = process.env.CLIENT_URL ?? LOCALHOST_CONFIG.urls.CLIENT;
				const redirectUrl = `${clientUrl}/auth/callback?error=oauth_failed&error_description=${encodeURIComponent('Google profile not available')}`;

				return res.redirect(redirectUrl);
			}

			const result = await this.authService.loginWithGoogle({
				googleId: payload.googleId,
				email: VALIDATORS.string(payload.email) ? payload.email : undefined,
				firstName: VALIDATORS.string(payload.firstName) ? payload.firstName : undefined,
				lastName: VALIDATORS.string(payload.lastName) ? payload.lastName : undefined,
				avatar: payload.avatar ? String(payload.avatar) : undefined,
			});

			logger.authInfo('Google OAuth login successful', {
				userId: result.user.id,
			});

			const clientUrl = process.env.CLIENT_URL ?? LOCALHOST_CONFIG.urls.CLIENT;
			const cookieOptions = {
				httpOnly: true,
				secure: process.env.COOKIE_SECURE !== 'false',
				sameSite: 'lax' as const,
				maxAge: 15 * TIME_PERIODS_MS.MINUTE,
				path: '/',
			};

			res.cookie('access_token', result.accessToken, cookieOptions);

			if (result.refreshToken) {
				res.cookie('refresh_token', result.refreshToken, {
					...cookieOptions,
					maxAge: TIME_PERIODS_MS.WEEK,
				});
			}

			const redirectUrl = `${clientUrl}/auth/callback?success=true&token=${encodeURIComponent(result.accessToken)}`;

			logger.systemInfo('Redirecting to client after successful OAuth', {
				redirectTo: redirectUrl.replace(/token=[^&]+/, 'token=***'),
				baseUrl: clientUrl,
			});

			return res.redirect(redirectUrl);
		} catch (error) {
			logger.authError('Google OAuth callback error', {
				errorInfo: { message: getErrorMessage(error) },
			});

			const clientUrl = process.env.CLIENT_URL ?? LOCALHOST_CONFIG.urls.CLIENT;
			const errorMessage = getErrorMessage(error);
			const redirectUrl = `${clientUrl}/auth/callback?error=oauth_failed&error_description=${encodeURIComponent(errorMessage)}`;

			logger.systemInfo('Redirecting to client after OAuth error', {
				redirectTo: redirectUrl.replace(/error_description=[^&]+/, 'error_description=***'),
				baseUrl: clientUrl,
			});

			return res.redirect(redirectUrl);
		}
	}

	@Get('admin/users')
	@UseGuards(LocalAuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
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

			const parsedLimit = VALIDATORS.string(limit) ? parseInt(limit, 10) : limit;
			const parsedOffset = VALIDATORS.string(offset) ? parseInt(offset, 10) : offset;
			const result = await this.userCoreService.getAllUsers(parsedLimit, parsedOffset);

			const adminUser: AdminUserData = {
				id: user.sub,
				...user,
				createdAt: new Date().toISOString(),
				lastLogin: undefined,
			};

			const { users, ...paginationData } = result;

			return {
				success: true,
				message: 'Users retrieved successfully',
				adminUser,
				users,
				pagination: paginationData,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.authError('Failed to get all users', {
				errorInfo: { message: getErrorMessage(error) },
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}
}
