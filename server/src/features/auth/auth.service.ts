import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { AuthenticationManager } from 'src/common/auth/authentication.manager';
import { JwtTokenService } from 'src/common/auth/jwt-token.service';
import { PasswordService } from 'src/common/auth/password.service';
import { Repository } from 'typeorm';

import { ERROR_CODES, ERROR_MESSAGES, SERVER_CACHE_KEYS, TIME_DURATIONS_SECONDS, UserRole } from '@shared/constants';
import type { ChangePasswordData, UserData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { UserEntity } from '@internal/entities';
import { CacheService, StorageService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import { createNotFoundError } from '@internal/utils';

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
		private readonly storageService: StorageService
	) {}

	async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
		const existingUser = await this.userRepository.findOne({
			where: { email: registerDto.email },
		});

		if (existingUser) {
			const passwordMatches = existingUser.passwordHash
				? await this.passwordService.comparePassword(registerDto.password, existingUser.passwordHash)
				: false;

			if (!passwordMatches) {
				throw new BadRequestException(ERROR_CODES.EMAIL_ALREADY_REGISTERED);
			}

			const tokenPair = await this.jwtTokenService.generateTokenPair(
				existingUser.id,
				existingUser.email,
				existingUser.role
			);

			return {
				accessToken: tokenPair.accessToken,
				refreshToken: tokenPair.refreshToken,
				user: {
					id: existingUser.id,
					email: existingUser.email,
					firstName: existingUser.firstName ?? undefined,
					lastName: existingUser.lastName ?? undefined,
					avatar: existingUser.preferences?.avatar,
					role: existingUser.role,
				},
			};
		}

		const adminExists = await this.userRepository.existsBy({
			role: UserRole.ADMIN,
		});
		const roleForNewUser = adminExists ? UserRole.USER : UserRole.ADMIN;

		const hashedPassword = await this.passwordService.hashPassword(registerDto.password);

		const user = this.userRepository.create({
			email: registerDto.email,
			passwordHash: hashedPassword,
			firstName: registerDto.firstName,
			lastName: registerDto.lastName,
			role: roleForNewUser,
			isActive: true,
		});

		const savedUser = await this.userRepository.save(user);

		const tokenPair = await this.jwtTokenService.generateTokenPair(savedUser.id, savedUser.email, savedUser.role);

		return {
			accessToken: tokenPair.accessToken,
			refreshToken: tokenPair.refreshToken,
			user: {
				id: savedUser.id,
				email: savedUser.email,
				firstName: savedUser.firstName ?? undefined,
				lastName: savedUser.lastName ?? undefined,
				avatar: savedUser.preferences?.avatar,
				role: savedUser.role,
			},
		};
	}

	async login(loginDto: LoginDto): Promise<AuthResponseDto> {
		try {
			const user = await this.userRepository.findOne({
				where: { email: loginDto.email, isActive: true },
			});

			if (!user) {
				logger.securityDenied('Login failed - user not found', {
					emails: { current: loginDto.email },
				});
				throw new UnauthorizedException(ERROR_CODES.INVALID_CREDENTIALS);
			}

			if (!user.passwordHash) {
				logger.securityDenied('Login failed - user has no password (OAuth only)', {
					emails: { current: loginDto.email },
					userId: user.id,
				});
				throw new UnauthorizedException(ERROR_CODES.INVALID_CREDENTIALS);
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
				throw new UnauthorizedException(authResult.error ?? ERROR_CODES.INVALID_CREDENTIALS);
			}

			if (!authResult.accessToken || !authResult.refreshToken || !authResult.user) {
				throw new UnauthorizedException(ERROR_CODES.AUTHENTICATION_RESULT_INCOMPLETE);
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
					accessToken: authResult.accessToken.substring(0, 20) + '...',
				},
				TIME_DURATIONS_SECONDS.TWO_HOURS
			);

			if (!sessionResult.success) {
				logger.userWarn('Failed to store user session data', {
					context: 'AUTH',
					userId: user.id,
					errorInfo: {
						message: sessionResult.error ?? ERROR_MESSAGES.general.UNKNOWN_ERROR,
					},
				});
			}

			return {
				accessToken: authResult.accessToken,
				refreshToken: authResult.refreshToken,
				user: {
					id: user.id,
					email: user.email,
					firstName: user.firstName ?? undefined,
					lastName: user.lastName ?? undefined,
					avatar: user.preferences?.avatar,
					role: user.role,
				},
			};
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw error;
		}
	}

	async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
		try {
			const authResult = await this.authenticationManager.refreshAccessToken(refreshTokenDto.refreshToken);

			if (authResult.error) {
				throw new UnauthorizedException(authResult.error ?? ERROR_CODES.INVALID_REFRESH_TOKEN);
			}

			if (!authResult.accessToken) {
				throw new UnauthorizedException(ERROR_CODES.AUTHENTICATION_RESULT_INCOMPLETE);
			}

			return {
				accessToken: authResult.accessToken,
			};
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw error;
		}
	}

	async getCurrentUser(
		userId: string
	): Promise<Pick<UserEntity, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'preferences' | 'createdAt'>> {
		try {
			logger.authDebug('getCurrentUser called', {
				userIds: {
					requested: userId,
				},
			});

			const user = await this.userRepository.findOne({
				where: { id: userId, isActive: true },
				select: ['id', 'email', 'firstName', 'lastName', 'role', 'preferences', 'createdAt'],
			});

			if (!user) {
				logger.authError('User not found in database', {
					userIds: {
						requested: userId,
					},
				});
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
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
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw error;
		}
	}

	async logout(userId: string): Promise<string> {
		// Use AuthenticationManager for logout
		await this.authenticationManager.logout(userId);

		// Clear user-specific cache entries to prevent stale data on re-login
		try {
			await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.AUTH.USER_LOGOUT_PATTERN_1(userId));
			await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.AUTH.USER_LOGOUT_PATTERN_2(userId));
			logger.authInfo('User cache cleared on logout', { userId });
		} catch (error) {
			logger.authError('Failed to clear user cache on logout', {
				userId,
				errorInfo: { message: String(error) },
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
				errorInfo: { message: String(error) },
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
			throw new BadRequestException(ERROR_CODES.GOOGLE_PROFILE_MISSING_IDENTIFIER);
		}

		const normalizedEmail = profile.email?.toLowerCase();

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
				lastLogin: new Date(),
			});

			const savedUser = await this.userRepository.save(user);

			logger.systemInfo('User created from Google profile', {
				userId: savedUser.id,
			});

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
			if (profile.firstName && (!user.firstName || user.firstName.trim() === '')) {
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
			if (profile.lastName && (!user.lastName || user.lastName.trim() === '')) {
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
			throw new UnauthorizedException(ERROR_CODES.USER_ACCOUNT_DISABLED);
		}

		const tokenPair = await this.jwtTokenService.generateTokenPair(user.id, user.email, user.role);

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
				role: user.role,
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
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Verify current password
			if (!user.passwordHash) {
				throw new BadRequestException(ERROR_CODES.PASSWORD_NOT_SET);
			}
			const isCurrentPasswordValid = await compare(changePasswordData.currentPassword, user.passwordHash);
			if (!isCurrentPasswordValid) {
				throw new UnauthorizedException(ERROR_CODES.CURRENT_PASSWORD_INCORRECT);
			}

			// Hash new password
			const newPasswordHash = await hash(changePasswordData.newPassword, 10);

			// Update password
			user.passwordHash = newPasswordHash;
			await this.userRepository.save(user);

			// Clear user cache
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.PROFILE(userId));

			return 'Password changed successfully';
		} catch (error) {
			logger.authError('Failed to change password', {
				context: 'AUTH',
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
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
			return savedUser;
		} catch (error) {
			logger.authError('Failed to create user', {
				emails: { current: userData.email },
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async createGoogleUser(userData: {
		googleId: string;
		email: string;
		firstName?: string;
		lastName?: string;
		// Note: avatar is not saved from Google OAuth (it's a URL, not our avatarId 1-16)
	}) {
		try {
			// Note: We don't save avatar from Google OAuth (it's a URL, not our avatarId 1-16)
			// Avatar can only be set through the dedicated /users/avatar endpoint
			const user = this.userRepository.create({
				googleId: userData.googleId,
				email: userData.email,
				firstName: userData.firstName,
				lastName: userData.lastName,
				role: UserRole.USER,
			});

			const savedUser = await this.userRepository.save(user);
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
