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

import { UserRole } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import { UserData } from '@shared/types';

import { UserEntity } from '@internal/entities';

import { AuthResponseDto, LoginDto, RefreshTokenDto, RefreshTokenResponseDto, RegisterDto } from './dtos/auth.dto';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly authenticationManager: AuthenticationManager,
		private readonly passwordService: PasswordService
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
				throw new BadRequestException('Email already exists');
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
					firstName: existingUser.firstName,
					lastName: existingUser.lastName,
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
				firstName: savedUser.firstName,
				lastName: savedUser.lastName,
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
				throw new UnauthorizedException('Invalid credentials');
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
				throw new UnauthorizedException(authResult.error || 'Invalid credentials');
			}

			// Type guard: we know these exist when there's no error
			if (!authResult.accessToken || !authResult.refreshToken || !authResult.user) {
				throw new UnauthorizedException('Authentication result incomplete');
			}

			// Update lastLogin timestamp
			user.lastLogin = new Date();
			await this.userRepository.save(user);

			return {
				access_token: authResult.accessToken,
				refresh_token: authResult.refreshToken,
				user: authResult.user,
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
				throw new UnauthorizedException(authResult.error || 'Invalid refresh token');
			}

			// Type guard: we know accessToken exists when there's no error
			if (!authResult.accessToken) {
				throw new UnauthorizedException('Authentication result incomplete');
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
	async getCurrentUser(userId: string): Promise<Omit<UserData, 'passwordHash'> & { passwordHash?: string }> {
		try {
			const user = await this.userRepository.findOne({
				where: { id: userId, isActive: true },
				select: ['id', 'email', 'firstName', 'lastName', 'role', 'avatar', 'createdAt'],
			});

			if (!user) {
				throw new UnauthorizedException('User not found');
			}

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
	async logout(userId: string): Promise<{ message: string }> {
		// Use AuthenticationManager for logout
		await this.authenticationManager.logout(userId);

		return {
			message: 'Logged out successfully',
		};
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
			throw new BadRequestException('Google profile is missing identifier');
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
				data: {
					googleId: profile.googleId,
					email,
					hasFirstName: !!firstName,
					firstName: firstName || undefined,
					hasLastName: !!lastName,
					lastName: lastName || undefined,
					hasAvatar: !!profile.avatar,
				},
			});

			user = this.userRepository.create({
				email,
				googleId: profile.googleId,
				firstName: firstName || undefined,
				lastName: lastName || undefined,
				avatar: profile.avatar,
				role: UserRole.USER,
				isActive: true,
				lastLogin: new Date(),
			});

			const savedUser = await this.userRepository.save(user);

			logger.systemInfo('User created from Google profile', {
				userId: savedUser.id,
				data: {
					hasFirstName: !!savedUser.firstName,
					firstName: savedUser.firstName || undefined,
					hasLastName: !!savedUser.lastName,
					lastName: savedUser.lastName || undefined,
					hasAvatar: !!savedUser.avatar,
				},
			});

			// Verify data was saved correctly
			const verifyUser = await this.userRepository.findOne({ where: { id: savedUser.id } });
			if (verifyUser) {
				logger.systemInfo('Verified saved user data', {
					userId: verifyUser.id,
					data: {
						hasFirstName: !!verifyUser.firstName,
						firstName: verifyUser.firstName || undefined,
						hasLastName: !!verifyUser.lastName,
						lastName: verifyUser.lastName || undefined,
						hasAvatar: !!verifyUser.avatar,
					},
				});
			}
		} else {
			// Ensure googleId stored and update avatar/full name if missing
			let shouldPersist = false;

			logger.systemInfo('Updating existing user from Google profile', {
				userId: user.id,
				data: {
					currentFirstName: user.firstName || undefined,
					currentLastName: user.lastName || undefined,
					currentAvatar: user.avatar || undefined,
					profileFirstName: profile.firstName || undefined,
					profileLastName: profile.lastName || undefined,
					profileAvatar: profile.avatar || undefined,
				},
			});

			if (!user.googleId) {
				user.googleId = profile.googleId;
				shouldPersist = true;
			}
			if (!user.avatar && profile.avatar) {
				user.avatar = profile.avatar;
				shouldPersist = true;
			}
			// Update firstName and lastName if they exist in profile and user doesn't have them
			// This ensures we fill missing data from Google
			// Also update if profile has data and user field is empty/null
			if (profile.firstName && (!user.firstName || user.firstName.trim() === '')) {
				user.firstName = profile.firstName;
				shouldPersist = true;
				logger.systemInfo('Updating firstName from Google profile', {
					userId: user.id,
					data: {
						oldFirstName: user.firstName || undefined,
						newFirstName: profile.firstName,
					},
				});
			}
			if (profile.lastName && (!user.lastName || user.lastName.trim() === '')) {
				user.lastName = profile.lastName;
				shouldPersist = true;
				logger.systemInfo('Updating lastName from Google profile', {
					userId: user.id,
					data: {
						oldLastName: user.lastName || undefined,
						newLastName: profile.lastName,
					},
				});
			}
			// Always update lastLogin on successful login
			user.lastLogin = new Date();
			shouldPersist = true;
			if (shouldPersist) {
				await this.userRepository.save(user);

				logger.systemInfo('User updated from Google profile', {
					userId: user.id,
					data: {
						hasFirstName: !!user.firstName,
						firstName: user.firstName || undefined,
						hasLastName: !!user.lastName,
						lastName: user.lastName || undefined,
						hasAvatar: !!user.avatar,
					},
				});
			}
		}

		if (!user.isActive) {
			throw new UnauthorizedException('User account is disabled');
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
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
			},
		};

		logger.systemInfo('Google OAuth login response', {
			userId: user.id,
			data: {
				hasFirstName: !!response.user.firstName,
				firstName: response.user.firstName || undefined,
				hasLastName: !!response.user.lastName,
				lastName: response.user.lastName || undefined,
			},
		});

		return response;
	}
}
