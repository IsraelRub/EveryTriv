/**
 * Auth Service
 *
 * @module AuthService
 * @description Authentication service with login, register, and token management
 */
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthenticationManager } from 'src/common/auth/authentication.manager';
import { PasswordService } from 'src/common/auth/password.service';
import { Repository } from 'typeorm';

import { ERROR_CODES, UserRole } from '@shared/constants';
import { UserEntity } from '@internal/entities';
import { CacheService } from '@internal/modules/cache/cache.service';
import { ServerStorageService } from '@internal/modules/storage/storage.service';
import { serverLogger as logger } from '@internal/services';
import type { UserData } from '@internal/types';
import { AuthResponseDto, LoginDto, RefreshTokenDto, RefreshTokenResponseDto, RegisterDto } from './dtos/auth.dto';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly authenticationManager: AuthenticationManager,
		private readonly passwordService: PasswordService,
		private readonly cacheService: CacheService,
		private readonly storageService: ServerStorageService
	) {}

	/**
	 * Register a new user
	 * @param registerDto User registration data
	 * @returns Authentication response with tokens and user data
	 * @throws BadRequestException if email already exists
	 */
	async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
		// Check if email already exists
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

			const tokenPair = await this.authenticationManager.generateTokensForUser({
				id: existingUser.id,
				email: existingUser.email,
				role: existingUser.role,
			});

			return {
				access_token: tokenPair.accessToken,
				refresh_token: tokenPair.refreshToken,
				user: {
					id: existingUser.id,
					email: existingUser.email,
					firstName: existingUser.firstName || undefined,
					lastName: existingUser.lastName || undefined,
					avatar: existingUser.preferences?.avatar,
					role: existingUser.role,
				},
			};
		}

		// Determine role for new user: first registered user becomes admin
		const adminExists = await this.userRepository.existsBy({ role: UserRole.ADMIN });
		const roleForNewUser = adminExists ? UserRole.USER : UserRole.ADMIN;

		// Hash password using PasswordService
		const hashedPassword = await this.passwordService.hashPassword(registerDto.password);

		// Create user
		const user = this.userRepository.create({
			email: registerDto.email,
			passwordHash: hashedPassword,
			firstName: registerDto.firstName,
			lastName: registerDto.lastName,
			role: roleForNewUser,
			isActive: true,
		});

		const savedUser = await this.userRepository.save(user);

		// Generate tokens using AuthenticationManager
		const tokenPair = await this.authenticationManager.generateTokensForUser({
			id: savedUser.id,
			email: savedUser.email,
			role: savedUser.role,
		});

		return {
			access_token: tokenPair.accessToken,
			refresh_token: tokenPair.refreshToken,
			user: {
				id: savedUser.id,
				email: savedUser.email,
				firstName: savedUser.firstName || undefined,
				lastName: savedUser.lastName || undefined,
					avatar: savedUser.preferences?.avatar,
				role: savedUser.role,
			},
		};
	}

	/**
	 * Login user
	 * @param loginDto User login credentials (email)
	 * @returns Authentication response with tokens and user data
	 * @throws UnauthorizedException if credentials are invalid
	 * @throws BadRequestException if email is not provided
	 */
	async login(loginDto: LoginDto): Promise<AuthResponseDto> {
		try {
			// Find user by email
			const user = await this.userRepository.findOne({
				where: { email: loginDto.email, isActive: true },
			});

			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.INVALID_CREDENTIALS);
			}

			// Use AuthenticationManager for authentication
			const authResult = await this.authenticationManager.authenticate(
				{ email: user.email, password: loginDto.password },
				{
					id: user.id,
					email: user.email,
					passwordHash: user.passwordHash || '',
					role: user.role,
					isActive: user.isActive,
				}
			);

			if (authResult.error) {
				throw new UnauthorizedException(authResult.error || ERROR_CODES.INVALID_CREDENTIALS);
			}

			// Type guard: we know these exist when there's no error
			if (!authResult.accessToken || !authResult.refreshToken || !authResult.user) {
				throw new UnauthorizedException(ERROR_CODES.AUTHENTICATION_RESULT_INCOMPLETE);
			}

			// Update lastLogin timestamp
			user.lastLogin = new Date();
			await this.userRepository.save(user);

			return {
				access_token: authResult.accessToken,
				refresh_token: authResult.refreshToken,
				user: {
					id: user.id,
					email: user.email,
					firstName: user.firstName || undefined,
					lastName: user.lastName || undefined,
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

	/**
	 * Refresh access token
	 * @param refreshTokenDto Refresh token data
	 * @returns New access token
	 * @throws UnauthorizedException if refresh token is invalid
	 */
	async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
		try {
			// Use AuthenticationManager for token refresh
			const authResult = await this.authenticationManager.refreshAccessToken(refreshTokenDto.refreshToken);

			if (authResult.error) {
				throw new UnauthorizedException(authResult.error || ERROR_CODES.INVALID_REFRESH_TOKEN);
			}

			// Type guard: we know accessToken exists when there's no error
			if (!authResult.accessToken) {
				throw new UnauthorizedException(ERROR_CODES.AUTHENTICATION_RESULT_INCOMPLETE);
			}

			return {
				access_token: authResult.accessToken,
			};
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw error;
		}
	}

	/**
	 * Get current user
	 * @param userId User ID
	 * @returns User data without password hash
	 * @throws UnauthorizedException if user not found
	 */
	async getCurrentUser(userId: string): Promise<
		Pick<UserEntity, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'preferences' | 'createdAt'>
	> {
		try {
			logger.authDebug('getCurrentUser called', {
				requestedUserId: userId,
			});

			const user = await this.userRepository.findOne({
				where: { id: userId, isActive: true },
				select: ['id', 'email', 'firstName', 'lastName', 'role', 'preferences', 'createdAt'],
			});

			if (!user) {
				logger.authError('User not found in database', {
					requestedUserId: userId,
				});
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			logger.authDebug('User found in database', {
				userId: user.id,
				email: user.email,
				role: user.role,
				requestedUserId: userId,
			});

			return user;
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw error;
		}
	}

	/**
	 * Logout user (invalidate tokens)
	 * @param userId User ID
	 * @returns Success message
	 */
	async logout(userId: string): Promise<string> {
		// Use AuthenticationManager for logout
		await this.authenticationManager.logout(userId);

		// Clear user-specific cache entries to prevent stale data on re-login
		try {
			await this.cacheService.invalidatePattern(`*:${userId}`);
			await this.cacheService.invalidatePattern(`*:${userId}:*`);
			logger.authInfo('User cache cleared on logout', { userId });
		} catch (error) {
			logger.authError('Failed to clear user cache on logout', { userId, error: String(error) });
		}

		// Clear user session data from Redis storage
		try {
			const sessionKey = `user_session:${userId}`;
			await this.storageService.delete(sessionKey);
			logger.authInfo('User session data cleared on logout', { userId });
		} catch (error) {
			logger.authError('Failed to clear user session data on logout', { userId, error: String(error) });
		}

		return 'Logged out successfully';
	}

	/**
	 * Validate user credentials
	 * @param email Email
	 * @param password Password
	 * @returns User data if valid, null otherwise
	 */
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

	/**
	 * Login or register user via Google OAuth profile
	 * @param profile Google profile payload
	 */
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
				email,
			});

			// Note: We don't save avatar from Google OAuth (it's a URL, not our avatarId 1-16)
			// Avatar can only be set through the dedicated /users/avatar endpoint
			user = this.userRepository.create({
				email,
				googleId: profile.googleId,
				firstName: firstName || undefined,
				lastName: lastName || undefined,
				role: UserRole.USER,
				isActive: true,
				lastLogin: new Date(),
			});

			const savedUser = await this.userRepository.save(user);

			logger.systemInfo('User created from Google profile', {
				userId: savedUser.id,
			});

			// Verify data was saved correctly
			const verifyUser = await this.userRepository.findOne({ where: { id: savedUser.id } });
			if (verifyUser) {
				logger.systemInfo('Verified saved user data', {
					userId: verifyUser.id,
					firstName: verifyUser.firstName || undefined,
					lastName: verifyUser.lastName || undefined,
				});
			}
		} else {
			// Ensure googleId stored and update avatar/full name if missing
			let shouldPersist = false;

			logger.systemInfo('Updating existing user from Google profile', {
				userId: user.id,
				currentFirstName: user.firstName || undefined,
				currentLastName: user.lastName || undefined,
				avatar: user.preferences?.avatar,
				newFirstName: profile.firstName || undefined,
				newLastName: profile.lastName || undefined,
			});

			if (!user.googleId) {
				user.googleId = profile.googleId;
				shouldPersist = true;
			}
			// Note: We don't save avatar from Google OAuth (it's a URL, not our avatarId 1-16)
			// Avatar can only be set through the dedicated /users/avatar endpoint
			// Update firstName and lastName if they exist in profile and user doesn't have them
			// This ensures we fill missing data from Google
			// Also update if profile has data and user field is empty/null
			if (profile.firstName && (!user.firstName || user.firstName.trim() === '')) {
				user.firstName = profile.firstName;
				shouldPersist = true;
				logger.systemInfo('Updating firstName from Google profile', {
					userId: user.id,
					oldFirstName: user.firstName || undefined,
					newFirstName: profile.firstName,
				});
			}
			if (profile.lastName && (!user.lastName || user.lastName.trim() === '')) {
				user.lastName = profile.lastName;
				shouldPersist = true;
				logger.systemInfo('Updating lastName from Google profile', {
					userId: user.id,
					oldLastName: user.lastName || undefined,
					newLastName: profile.lastName,
				});
			}
			// Always update lastLogin on successful login
			user.lastLogin = new Date();
			shouldPersist = true;
			if (shouldPersist) {
				await this.userRepository.save(user);

				logger.systemInfo('User updated from Google profile', {
					userId: user.id,
					firstName: user.firstName || undefined,
					lastName: user.lastName || undefined,
				});
			}
		}

		if (!user.isActive) {
			throw new UnauthorizedException(ERROR_CODES.USER_ACCOUNT_DISABLED);
		}

		const tokenPair = await this.authenticationManager.generateTokensForUser({
			id: user.id,
			email: user.email,
			role: user.role,
		});

		const response = {
			access_token: tokenPair.accessToken,
			refresh_token: tokenPair.refreshToken,
			user: {
				id: user.id,
				email: user.email,
				firstName: user.firstName || undefined,
				lastName: user.lastName || undefined,
				avatar: user.preferences?.avatar,
				role: user.role,
			},
		};

		logger.systemInfo('Google OAuth login response', {
			userId: user.id,
			firstName: response.user.firstName || undefined,
			lastName: response.user.lastName || undefined,
		});

		return response;
	}
}
