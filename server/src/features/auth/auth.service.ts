import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ErrorCode, LogContext, TIME_DURATIONS_SECONDS, UserRole, VALIDATION_LENGTH } from '@shared/constants';
import type { ChangePasswordData } from '@shared/types';
import { getErrorMessage, isNonEmptyString, sanitizeEmail, truncateWithEllipsis } from '@shared/utils';

import { AppConfig } from '@config';
import { AuthenticationManager, JwtTokenService, PasswordService } from '@common/auth';
import { SERVER_CACHE_KEYS } from '@internal/constants';
import { UserEntity } from '@internal/entities';
import { CacheInvalidationService, CacheService, StorageService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { CreateGoogleUserData, UserData } from '@internal/types';
import { createNotFoundError, getAvatarUrlForUser } from '@internal/utils';

import { AuthResponseDto, LoginDto, RefreshTokenDto, RefreshTokenResponseDto, RegisterDto } from './dtos/auth.dto';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly authenticationManager: AuthenticationManager,
		private readonly jwtTokenService: JwtTokenService,
		private readonly passwordService: PasswordService,
		private readonly cacheService: CacheService,
		private readonly cacheInvalidationService: CacheInvalidationService,
		private readonly storageService: StorageService
	) {}

	async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
		const email = sanitizeEmail(registerDto.email);
		const existingUser = await this.userRepository.findOne({
			where: { email },
		});

		if (existingUser) {
			throw new BadRequestException(ErrorCode.EMAIL_ALREADY_REGISTERED);
		}

		const adminExists = await this.userRepository.existsBy({
			role: UserRole.ADMIN,
		});
		const roleForNewUser = adminExists ? UserRole.USER : UserRole.ADMIN;

		const hashedPassword = await this.passwordService.hashPassword(registerDto.password);

		// Admin users don't need credits - they have unlimited access
		const isAdmin = roleForNewUser === UserRole.ADMIN;

		const user = this.userRepository.create({
			email,
			passwordHash: hashedPassword,
			firstName: registerDto.firstName,
			lastName: registerDto.lastName,
			role: roleForNewUser,
			isActive: true,
			emailVerified: false,
			credits: isAdmin ? null : undefined, // NULL for admin (not applicable), default (150) for regular users
			purchasedCredits: 0,
		});

		const savedUser = await this.userRepository.save(user);

		try {
			await this.cacheInvalidationService.invalidateOnUserCreated();
		} catch (e) {
			logger.cacheError('invalidateOnUserCreated', 'auth.register', { errorInfo: { message: getErrorMessage(e) } });
		}

		const tokenPair = await this.jwtTokenService.generateTokenPair(savedUser.id, savedUser.email, savedUser.role);

		const avatarUrl = getAvatarUrlForUser(savedUser, AppConfig.apiPublicBaseUrl);
		return {
			accessToken: tokenPair.accessToken,
			refreshToken: tokenPair.refreshToken,
			user: {
				id: savedUser.id,
				email: savedUser.email,
				firstName: savedUser.firstName ?? undefined,
				lastName: savedUser.lastName ?? undefined,
				avatar: savedUser.preferences?.avatar,
				avatarUrl,
				role: savedUser.role,
				emailVerified: savedUser.emailVerified,
			},
		};
	}

	async login(loginDto: LoginDto): Promise<AuthResponseDto> {
		const email = sanitizeEmail(loginDto.email);
		const user = await this.userRepository.findOne({
			where: { email, isActive: true },
		});

		if (!user) {
			logger.securityDenied('Login failed - user not found', {
				emails: { current: loginDto.email },
			});
			throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS);
		}

		if (!user.passwordHash) {
			logger.securityDenied('Login failed - user has no password (OAuth only)', {
				emails: { current: loginDto.email },
				userId: user.id,
			});
			throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS);
		}

		const authResult = await this.authenticationManager.authenticate(
			{ email: user.email, password: loginDto.password },
			{
				id: user.id,
				email: user.email,
				passwordHash: user.passwordHash ?? '',
				role: user.role,
				isActive: user.isActive,
			}
		);

		if (authResult.error) {
			throw new UnauthorizedException(authResult.error ?? ErrorCode.INVALID_CREDENTIALS);
		}

		if (!authResult.accessToken || !authResult.refreshToken || !authResult.user) {
			throw new UnauthorizedException(ErrorCode.AUTHENTICATION_RESULT_INCOMPLETE);
		}

		user.lastLogin = new Date();
		await this.userRepository.save(user);

		// Store user session data
		const sessionKey = `user_session:${user.id}`;
		const sessionResult = await this.storageService.set(
			sessionKey,
			{
				userId: user.id,
				lastLogin: new Date().toISOString(),
				accessToken: truncateWithEllipsis(authResult.accessToken, VALIDATION_LENGTH.STRING_TRUNCATION.TOKEN_PREVIEW),
			},
			TIME_DURATIONS_SECONDS.TWO_HOURS
		);

		if (!sessionResult.success) {
			logger.userWarn('Failed to store user session data', {
				context: LogContext.AUTH,
				userId: user.id,
				errorInfo: { message: getErrorMessage(sessionResult.error) },
			});
		}

		const avatarUrl = getAvatarUrlForUser(user, AppConfig.apiPublicBaseUrl);
		return {
			accessToken: authResult.accessToken,
			refreshToken: authResult.refreshToken,
			user: {
				id: user.id,
				email: user.email,
				firstName: user.firstName ?? undefined,
				lastName: user.lastName ?? undefined,
				avatar: user.preferences?.avatar,
				avatarUrl,
				role: user.role,
				emailVerified: user.emailVerified,
			},
		};
	}

	async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
		const authResult = await this.authenticationManager.refreshAccessToken(refreshTokenDto.refreshToken);

		if (authResult.error) {
			throw new UnauthorizedException(authResult.error ?? ErrorCode.INVALID_REFRESH_TOKEN);
		}

		if (!authResult.accessToken) {
			throw new UnauthorizedException(ErrorCode.AUTHENTICATION_RESULT_INCOMPLETE);
		}

		return {
			accessToken: authResult.accessToken,
		};
	}

	async getCurrentUser(
		userId: string
	): Promise<
		Pick<UserEntity, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'preferences' | 'createdAt' | 'emailVerified'>
	> {
		logger.authDebug('getCurrentUser called', {
			userIds: {
				requested: userId,
			},
		});

		const user = await this.userRepository.findOne({
			where: { id: userId, isActive: true },
			select: [
				'id',
				'email',
				'firstName',
				'lastName',
				'role',
				'preferences',
				'customAvatar',
				'createdAt',
				'emailVerified',
			],
		});

		if (!user) {
			logger.authError('User not found in database', {
				userIds: {
					requested: userId,
				},
			});
			throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
		}

		logger.authDebug('User found in database', {
			userId: user.id,
			emails: { current: user.email },
			role: user.role,
			userIds: {
				requested: userId,
			},
		});

		return user;
	}

	async logout(userId: string): Promise<string> {
		logger.authInfo('User logout', { userId });

		// Clear user-specific cache entries to prevent stale data on re-login
		try {
			await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.AUTH.USER_LOGOUT_PATTERN_1(userId));
			await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.AUTH.USER_LOGOUT_PATTERN_2(userId));
			logger.authInfo('User cache cleared on logout', { userId });
		} catch (error) {
			logger.authError('Failed to clear user cache on logout', {
				userId,
				errorInfo: { message: getErrorMessage(error) },
			});
		}

		// Clear user session data from Redis storage
		try {
			const sessionKey = `user_session:${userId}`;
			await this.storageService.delete(sessionKey);
			logger.authInfo('User session data cleared on logout', { userId });
		} catch (error) {
			logger.authError('Failed to clear user session data on logout', {
				userId,
				errorInfo: { message: getErrorMessage(error) },
			});
		}

		return 'Logged out successfully';
	}

	async validateUser(email: string, password: string): Promise<Omit<UserData, 'passwordHash'> | null> {
		const user = await this.userRepository.findOne({
			where: { email, isActive: true },
		});

		if (!user) {
			return null;
		}

		const { passwordHash, ...result } = user;

		if (!passwordHash) {
			return null;
		}

		const isPasswordValid = await this.passwordService.comparePassword(password, passwordHash);
		if (isPasswordValid) {
			return result;
		}

		return null;
	}

	async loginWithGoogle(profile: {
		googleId: string;
		email?: string;
		firstName?: string;
		lastName?: string;
		avatar?: string;
	}): Promise<AuthResponseDto> {
		if (!profile.googleId) {
			throw new BadRequestException(ErrorCode.GOOGLE_PROFILE_MISSING_IDENTIFIER);
		}

		const normalizedEmail = profile.email ? sanitizeEmail(profile.email) : undefined;

		let user = await this.userRepository.findOne({
			where: [{ googleId: profile.googleId }, ...(normalizedEmail ? [{ email: normalizedEmail }] : [])],
		});

		if (!user) {
			const email = normalizedEmail ?? `${profile.googleId}@googleuser.everytriv`;
			const firstName = profile.firstName;
			const lastName = profile.lastName;

			logger.systemInfo('Creating new user from Google profile', {
				googleId: profile.googleId,
				emails: { current: email },
			});

			user = this.userRepository.create({
				email,
				googleId: profile.googleId,
				firstName: firstName ?? undefined,
				lastName: lastName ?? undefined,
				role: UserRole.USER,
				isActive: true,
				emailVerified: true,
				lastLogin: new Date(),
			});

			const savedUser = await this.userRepository.save(user);

			logger.systemInfo('User created from Google profile', {
				userId: savedUser.id,
			});

			try {
				await this.cacheInvalidationService.invalidateOnUserCreated();
			} catch (e) {
				logger.cacheError('invalidateOnUserCreated', 'auth.google', { errorInfo: { message: getErrorMessage(e) } });
			}

			const verifyUser = await this.userRepository.findOne({
				where: { id: savedUser.id },
			});
			if (verifyUser) {
				logger.systemInfo('Verified saved user data', {
					userId: verifyUser.id,

					nameChanges: {
						current: {
							// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
							firstName: verifyUser.firstName || undefined,
							// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
							lastName: verifyUser.lastName || undefined,
						},
					},
				});
			}
		} else {
			let shouldPersist = false;

			logger.systemInfo('Updating existing user from Google profile', {
				userId: user.id,
				nameChanges: {
					current: {
						firstName: user.firstName ?? undefined,
						lastName: user.lastName ?? undefined,
					},
					new: {
						firstName: profile.firstName ?? undefined,
						lastName: profile.lastName ?? undefined,
					},
				},
				avatar: user.preferences?.avatar,
			});

			if (!user.googleId) {
				user.googleId = profile.googleId;
				shouldPersist = true;
			}
			if (!user.emailVerified) {
				user.emailVerified = true;
				shouldPersist = true;
			}
			if (profile.firstName && !isNonEmptyString(user.firstName)) {
				user.firstName = profile.firstName;
				shouldPersist = true;
				logger.systemInfo('Updating firstName from Google profile', {
					userId: user.id,
					nameChanges: {
						old: {
							firstName: user.firstName ?? undefined,
						},
						new: {
							firstName: profile.firstName,
						},
					},
				});
			}
			if (profile.lastName && !isNonEmptyString(user.lastName)) {
				user.lastName = profile.lastName;
				shouldPersist = true;
				logger.systemInfo('Updating lastName from Google profile', {
					userId: user.id,
					nameChanges: {
						old: {
							lastName: user.lastName ?? undefined,
						},
						new: {
							lastName: profile.lastName,
						},
					},
				});
			}
			user.lastLogin = new Date();
			shouldPersist = true;
			if (shouldPersist) {
				await this.userRepository.save(user);

				logger.systemInfo('User updated from Google profile', {
					userId: user.id,
					nameChanges: {
						current: {
							firstName: user.firstName ?? undefined,
							lastName: user.lastName ?? undefined,
						},
					},
				});
			}
		}

		if (!user.isActive) {
			throw new UnauthorizedException(ErrorCode.USER_ACCOUNT_DISABLED);
		}

		const tokenPair = await this.jwtTokenService.generateTokenPair(user.id, user.email, user.role);

		const avatarUrl = getAvatarUrlForUser(user, AppConfig.apiPublicBaseUrl);
		const response = {
			accessToken: tokenPair.accessToken,
			refreshToken: tokenPair.refreshToken,
			user: {
				id: user.id,
				email: user.email,
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				firstName: user.firstName || undefined,
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				lastName: user.lastName || undefined,
				avatar: user.preferences?.avatar,
				avatarUrl,
				role: user.role,
				emailVerified: user.emailVerified,
			},
		};

		logger.systemInfo('Google OAuth login response', {
			userId: user.id,
			nameChanges: {
				current: {
					firstName: response.user.firstName ?? undefined,
					lastName: response.user.lastName ?? undefined,
				},
			},
		});

		return response;
	}

	async changePassword(userId: string, changePasswordData: ChangePasswordData) {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Verify current password
			if (!user.passwordHash) {
				throw new BadRequestException(ErrorCode.PASSWORD_NOT_SET);
			}
			const isCurrentPasswordValid = await this.passwordService.comparePassword(
				changePasswordData.currentPassword,
				user.passwordHash
			);
			if (!isCurrentPasswordValid) {
				throw new UnauthorizedException(ErrorCode.CURRENT_PASSWORD_INCORRECT);
			}

			// Hash new password
			const newPasswordHash = await this.passwordService.hashPassword(changePasswordData.newPassword, 10);

			// Update password
			user.passwordHash = newPasswordHash;
			await this.userRepository.save(user);

			// Clear user cache
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.PROFILE(userId));

			return 'Password changed successfully';
		} catch (error) {
			logger.authError('Failed to change password', {
				context: LogContext.AUTH,
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async requestVerificationEmail(userId: string): Promise<{ verificationLink: string }> {
		const user = await this.userRepository.findOne({
			where: { id: userId },
			select: ['id', 'emailVerified'],
		});
		if (!user) {
			throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
		}
		if (user.emailVerified) {
			throw new BadRequestException(ErrorCode.EMAIL_ALREADY_VERIFIED);
		}
		const token = randomUUID();
		const cacheKey = SERVER_CACHE_KEYS.AUTH.EMAIL_VERIFY(token);
		await this.cacheService.set(cacheKey, userId, TIME_DURATIONS_SECONDS.DAY);
		const baseUrl =
			process.env.SERVER_PUBLIC_URL ?? process.env.SERVER_URL ?? `http://${AppConfig.domain}:${AppConfig.port}`;
		const verificationLink = `${baseUrl}/auth/verify-email?token=${token}`;
		logger.authInfo('Verification link requested', { userId });
		return { verificationLink };
	}

	async verifyEmail(token: string): Promise<{ verified: boolean }> {
		const cacheKey = SERVER_CACHE_KEYS.AUTH.EMAIL_VERIFY(token);
		const result = await this.cacheService.get(cacheKey);
		if (!result.success || result.data == null) {
			throw new BadRequestException(ErrorCode.VERIFICATION_TOKEN_INVALID_OR_EXPIRED);
		}
		const userId = typeof result.data === 'string' ? result.data : String(result.data);
		const user = await this.userRepository.findOne({ where: { id: userId } });
		if (!user) {
			throw new BadRequestException(ErrorCode.VERIFICATION_TOKEN_INVALID_OR_EXPIRED);
		}
		if (user.emailVerified) {
			await this.cacheService.delete(cacheKey);
			throw new BadRequestException(ErrorCode.EMAIL_ALREADY_VERIFIED);
		}
		user.emailVerified = true;
		await this.userRepository.save(user);
		await this.cacheService.delete(cacheKey);
		await this.cacheService.delete(SERVER_CACHE_KEYS.USER.PROFILE(userId));
		logger.authInfo('Email verified', { userId });
		return { verified: true };
	}

	async createUser(userData: {
		email: string;
		passwordHash: string;
		firstName?: string;
		lastName?: string;
		role?: UserRole;
	}) {
		try {
			const user = this.userRepository.create({
				email: userData.email,
				passwordHash: userData.passwordHash,
				firstName: userData.firstName,
				lastName: userData.lastName,
				role: userData.role ?? UserRole.USER,
			});

			const savedUser = await this.userRepository.save(user);
			try {
				await this.cacheInvalidationService.invalidateOnUserCreated();
			} catch (e) {
				logger.cacheError('invalidateOnUserCreated', 'auth.createUser', { errorInfo: { message: getErrorMessage(e) } });
			}
			return savedUser;
		} catch (error) {
			logger.authError('Failed to create user', {
				emails: { current: userData.email },
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async createGoogleUser(userData: CreateGoogleUserData) {
		try {
			const user = this.userRepository.create({
				googleId: userData.googleId,
				email: userData.email,
				firstName: userData.firstName,
				lastName: userData.lastName,
				role: UserRole.USER,
				emailVerified: true,
			});

			const savedUser = await this.userRepository.save(user);
			try {
				await this.cacheInvalidationService.invalidateOnUserCreated();
			} catch (e) {
				logger.cacheError('invalidateOnUserCreated', 'auth.createGoogleUser', {
					errorInfo: { message: getErrorMessage(e) },
				});
			}
			return savedUser;
		} catch (error) {
			logger.authError('Failed to create Google user', {
				googleId: userData.googleId,
				emails: { current: userData.email },
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async linkGoogleAccount(userId: string, googleId: string) {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			user.googleId = googleId;
			const updatedUser = await this.userRepository.save(user);
			return updatedUser;
		} catch (error) {
			logger.authError('Failed to link Google account', {
				userId,
				googleId,
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}
}
