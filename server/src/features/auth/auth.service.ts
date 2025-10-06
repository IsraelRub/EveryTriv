/**
 * Auth Service
 *
 * @module AuthService
 * @description Authentication service with login, register, and token management
 */
import { CurrentUserData, UserData } from '@shared';
import { AuthenticationManager } from 'src/common/auth/authentication.manager';
import { PasswordService } from 'src/common/auth/password.service';
import { UserEntity } from 'src/internal/entities';
import { Repository } from 'typeorm';

import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

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
	 */
	async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
		// Check if username or email already exists
		const existingUser = await this.userRepository.findOne({
			where: [{ username: registerDto.username }, { email: registerDto.email }],
		});

		if (existingUser) {
			throw new BadRequestException('Username or email already exists');
		}

		// Hash password using PasswordService
		const hashedPassword = await this.passwordService.hashPassword(registerDto.password);

		// Create user
		const user = this.userRepository.create({
			username: registerDto.username,
			email: registerDto.email,
			passwordHash: hashedPassword,
			firstName: registerDto.firstName,
			lastName: registerDto.lastName,
			role: 'user',
			isActive: true,
		});

		const savedUser = await this.userRepository.save(user);

		// Generate tokens using AuthenticationManager
		const tokenPair = await this.authenticationManager.generateTokensForUser({
			id: savedUser.id,
			username: savedUser.username,
			email: savedUser.email,
			role: savedUser.role,
		});

		return {
			access_token: tokenPair.accessToken,
			refresh_token: tokenPair.refreshToken,
			user: {
				id: savedUser.id,
				username: savedUser.username,
				email: savedUser.email,
				firstName: savedUser.firstName,
				lastName: savedUser.lastName,
				role: savedUser.role,
			},
		};
	}

	/**
	 * Login user
	 */
	async login(loginDto: LoginDto): Promise<AuthResponseDto> {
		const user = await this.userRepository.findOne({
			where: { username: loginDto.username, isActive: true },
		});

		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Use AuthenticationManager for authentication
		const authResult = await this.authenticationManager.authenticate(loginDto, {
			id: user.id,
			username: user.username,
			email: user.email,
			passwordHash: user.passwordHash || '',
			role: user.role,
			isActive: user.isActive,
		});

		if (!authResult.success) {
			throw new UnauthorizedException(authResult.error || 'Invalid credentials');
		}

		// Type guard: we know these exist when success is true
		if (!authResult.accessToken || !authResult.refreshToken || !authResult.user) {
			throw new UnauthorizedException('Authentication result incomplete');
		}

		return {
			access_token: authResult.accessToken,
			refresh_token: authResult.refreshToken,
			user: authResult.user,
		};
	}

	/**
	 * Refresh access token
	 */
	async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
		// Use AuthenticationManager for token refresh
		const authResult = await this.authenticationManager.refreshAccessToken(refreshTokenDto.refreshToken);

		if (!authResult.success) {
			throw new UnauthorizedException(authResult.error || 'Invalid refresh token');
		}

		// Type guard: we know accessToken exists when success is true
		if (!authResult.accessToken) {
			throw new UnauthorizedException('Authentication result incomplete');
		}

		return {
			access_token: authResult.accessToken,
		};
	}

	/**
	 * Get current user
	 */
	async getCurrentUser(userId: string): Promise<CurrentUserData> {
		const user = await this.userRepository.findOne({
			where: { id: userId, isActive: true },
			select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'avatar', 'createdAt'],
		});

		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		return user;
	}

	/**
	 * Logout user (invalidate tokens)
	 */
	async logout(userId: string, username: string): Promise<{ message: string }> {
		// Use AuthenticationManager for logout
		await this.authenticationManager.logout(userId, username);

		return {
			message: 'Logged out successfully',
		};
	}

	/**
	 * Validate user credentials
	 */
	async validateUser(username: string, password: string): Promise<Omit<UserData, 'passwordHash'> | null> {
		const user = await this.userRepository.findOne({
			where: { username, isActive: true },
		});

		if (user && user.passwordHash) {
			const isPasswordValid = await this.passwordService.comparePassword(password, user.passwordHash);
			if (isPasswordValid) {
				const { passwordHash, ...result } = user;
				return result;
			}
		}
		return null;
	}
}
