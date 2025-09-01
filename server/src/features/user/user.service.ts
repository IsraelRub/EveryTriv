import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserAddress, UserPreferences, UserPreferencesUpdate } from 'everytriv-shared/types';
import { normalizeText } from 'everytriv-shared/utils';
import { Repository } from 'typeorm';

import { LoggerService } from '../../shared/controllers';
import { UserEntity } from '../../shared/entities';
import { CacheService } from '../../shared/modules/cache';
import { ServerStorageService } from '../../shared/modules/storage';

/**
 * Service for managing user data, profiles, and authentication
 * Handles user CRUD operations, profile management, user statistics, and authentication
 */
@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly jwtService: JwtService,
		private readonly logger: LoggerService,
		private readonly cacheService: CacheService,
		private readonly storageService: ServerStorageService
	) {}

	/**
	 * Login user
	 * @param email User email
	 * @param password User password
	 * @returns Login result
	 */
	async login(email: string, password: string) {
		try {
			this.logger.securityLogin('User login attempt', {
				context: 'UserService',
				email: email.substring(0, 10) + '...',
			});

			// Get user by email
			const user = await this.getUserByEmail(email);
			if (!user || !user.isActive || !user.passwordHash) {
				throw new UnauthorizedException('Invalid credentials');
			}

			// Verify password
			const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
			if (!isPasswordValid) {
				throw new UnauthorizedException('Invalid credentials');
			}

			// Generate JWT tokens
			const accessToken = this.generateJWT(user.id, user.email, user.role);
			const refreshToken = this.generateJWT(user.id, user.email, user.role, '7d');

			// Store user session data (persistent storage - survives cache invalidation)
			const sessionKey = `user_session:${user.id}`;
			const result = await this.storageService.setItem(
				sessionKey,
				{
					userId: user.id,
					lastLogin: new Date().toISOString(),
					accessToken: accessToken.substring(0, 20) + '...', // Store partial token for tracking
				},
				86400 // 24 hours TTL
			);

			if (!result.success) {
				this.logger.userWarn('Failed to store user session data', {
					context: 'UserService',
					userId: user.id,
					error: result.error || 'Unknown error',
				});
			}

			return {
				success: true,
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					avatar: user.avatar,
					role: user.role,
				},
				accessToken,
				refreshToken,
				message: 'Login successful',
			};
		} catch (error) {
			this.logger.securityDenied('Login failed', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				email: email.substring(0, 10) + '...',
			});
			throw error;
		}
	}

	/**
	 * Register new user
	 * @param registerData Registration data
	 * @returns Registration result
	 */
	async register(registerData: {
		username: string;
		email: string;
		password: string;
		firstName?: string;
		lastName?: string;
	}) {
		try {
			this.logger.userInfo('User registration attempt', {
				email: registerData.email,
				username: registerData.username,
			});

			// Check if user already exists
			const existingEmail = await this.getUserByEmail(registerData.email);
			if (existingEmail) {
				throw new BadRequestException('Email already registered');
			}

			// Hash password
			const saltRounds = 12;
			const passwordHash = await bcrypt.hash(registerData.password, saltRounds);

			// Create user
			const user = await this.createUser({
				username: registerData.username,
				email: registerData.email,
				passwordHash,
				firstName: registerData.firstName,
				lastName: registerData.lastName,
			});

			// Generate JWT tokens
			const accessToken = this.generateJWT(user.id, user.email, user.role);
			const refreshToken = this.generateJWT(user.id, user.email, user.role, '7d');

			return {
				success: true,
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					avatar: user.avatar,
					role: user.role,
				},
				accessToken,
				refreshToken,
				message: 'Registration successful',
			};
		} catch (error) {
			this.logger.userError('Registration failed', {
				email: registerData.email,
				username: registerData.username,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Generate JWT token
	 * @param userId User ID
	 * @param email User email
	 * @param role User role
	 * @param expiresIn Token expiration time
	 * @returns JWT token
	 */
	private generateJWT(userId: string, email: string, role: string, expiresIn: string = '1h'): string {
		const payload = {
			sub: userId,
			email,
			role,
		};

		return this.jwtService.sign(payload, { expiresIn });
	}

	/**
	 * Get user profile by ID
	 * @param userId User ID
	 * @returns User profile
	 */
	async getUserProfile(userId: string) {
		try {
			this.logger.userInfo('Getting user profile', {
				context: 'UserService',
				userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			return {
				id: user.id,
				username: user.username,
				email: user.email,
				firstName: user.firstName,
				last_name: user.lastName,
				avatar: user.avatar,
				preferences: user.preferences,
				stats: user.stats,
				created_at: user.createdAt,
			};
		} catch (error) {
			this.logger.userError('Failed to get user profile', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Update user profile
	 * @param userId User ID
	 * @param profileData Profile data to update
	 * @returns Updated user profile
	 */
	async updateUserProfile(
		userId: string,
		profileData: {
			username?: string;
			first_name?: string;
			last_name?: string;
			avatar?: string;
			preferences?: UserPreferences;
			address?: UserAddress;
		}
	) {
		try {
			this.logger.userInfo('Updating user profile', {
				context: 'UserService',
				userId,
				fields: Object.keys(profileData),
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Validate username uniqueness if provided
			if (profileData.username && profileData.username !== user.username) {
				const existingUser = await this.userRepository.findOne({
					where: { username: profileData.username },
				});
				if (existingUser) {
					throw new BadRequestException('Username already taken');
				}
			}

			// Update user fields
			Object.assign(user, profileData);

			// Save updated user
			const updatedUser = await this.userRepository.save(user);

			return {
				id: updatedUser.id,
				username: updatedUser.username,
				first_name: updatedUser.firstName,
				last_name: updatedUser.lastName,
				avatar: updatedUser.avatar,
				preferences: updatedUser.preferences,
				message: 'Profile updated successfully',
			};
		} catch (error) {
			this.logger.userError('Failed to update user profile', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get user statistics
	 * @param userId User ID
	 * @returns User statistics
	 */
	async getUserStats(userId: string) {
		try {
			this.logger.userInfo('Getting user stats', {
				context: 'UserService',
				userId,
			});

			const cacheKey = `user:stats:${userId}`;

			return await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					const user = await this.userRepository.findOne({ where: { id: userId } });
					if (!user) {
						throw new NotFoundException('User not found');
					}

					return {
						userId: user.id,
						username: user.username,
						credits: user.credits,
						purchasedPoints: user.purchasedPoints,
						totalPoints: user.credits + user.purchasedPoints,
						stats: user.stats || {},
						created_at: user.createdAt,
						accountAge: user.createdAt
							? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
							: 0,
					};
				},
				600 // Cache for 10 minutes - user stats don't change frequently
			);
		} catch (error) {
			this.logger.userError('Failed to get user stats', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Search users
	 * @param query Search query
	 * @param limit Number of results to return
	 * @returns Search results
	 */
	async searchUsers(query: string, limit: number = 10) {
		try {
			this.logger.userInfo('Searching users', {
				context: 'UserService',
				query,
				limit,
			});

			// Normalize search query
			const normalizedQuery = normalizeText(query);
			if (!normalizedQuery || normalizedQuery.length < 2) {
				throw new BadRequestException('Search query must be at least 2 characters long');
			}

			const cacheKey = `user:search:${normalizedQuery}:${limit}`;

			return await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					const users = await this.userRepository
						.createQueryBuilder('user')
						.where('user.username ILIKE :query OR user.firstName ILIKE :query OR user.lastName ILIKE :query', {
							query: `%${normalizedQuery}%`,
						})
						.andWhere('user.is_active = :isActive', { isActive: true })
						.select(['user.id', 'user.username', 'user.firstName', 'user.lastName', 'user.avatar'])
						.limit(limit)
						.getMany();

					return {
						query,
						results: users.map(user => ({
							id: user.id,
							username: user.username,
							firstName: user.firstName,
							lastName: user.lastName,
							avatar: user.avatar,
							displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
						})),
						totalResults: users.length,
					};
				},
				300 // Cache for 5 minutes - search results can change frequently
			);
		} catch (error) {
			this.logger.userError('Failed to search users', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				query,
			});
			throw error;
		}
	}

	/**
	 * Get user by username
	 * @param username Username
	 * @returns User profile
	 */
	async getUserByUsername(username: string) {
		try {
			this.logger.userInfo('Getting user by username', {
				context: 'UserService',
				username,
			});

			const user = await this.userRepository.findOne({ where: { username } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			return {
				id: user.id,
				username: user.username,
				firstName: user.firstName,
				lastName: user.lastName,
				avatar: user.avatar,
				created_at: user.createdAt,
			};
		} catch (error) {
			this.logger.userError('Failed to get user by username', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				username,
			});
			throw error;
		}
	}

	/**
	 * Delete user account
	 * @param userId User ID
	 * @returns Deletion result
	 */
	async deleteUserAccount(userId: string) {
		try {
			this.logger.userInfo('Deleting user account', {
				context: 'UserService',
				userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Soft delete by setting is_active to false
			user.isActive = false;
			await this.userRepository.save(user);

			return {
				success: true,
				message: 'Account deleted successfully',
			};
		} catch (error) {
			this.logger.userError('Failed to delete user account', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Update user preferences
	 * @param userId User ID
	 * @param preferences User preferences
	 * @returns Updated preferences
	 */
	async updateUserPreferences(userId: string, preferences: UserPreferencesUpdate) {
		try {
			this.logger.userInfo('Updating user preferences', {
				context: 'UserService',
				userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Merge existing preferences with new ones
			user.preferences = { ...user.preferences, ...preferences };
			await this.userRepository.save(user);

			return {
				success: true,
				preferences: user.preferences,
				message: 'Preferences updated successfully',
			};
		} catch (error) {
			this.logger.userError('Failed to update user preferences', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Update user
	 * @param userId User ID
	 * @param updates Updates to apply
	 * @returns Updated user
	 */
	async updateUser(userId: string, updates: Partial<UserEntity>): Promise<UserEntity> {
		try {
			this.logger.userInfo('Updating user', {
				context: 'UserService',
				userId,
				fields: Object.keys(updates),
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Apply updates
			Object.assign(user, updates);
			const updatedUser = await this.userRepository.save(user);

			return updatedUser;
		} catch (error) {
			this.logger.userError('Failed to update user', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get user by email
	 * @param email User email
	 * @returns User entity
	 */
	async getUserByEmail(email: string) {
		try {
			this.logger.userInfo('Getting user by email', {
				context: 'UserService',
				email: email.substring(0, 10) + '...',
			});

			const user = await this.userRepository.findOne({ where: { email } });
			return user;
		} catch (error) {
			this.logger.userError('Failed to get user by email', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				email: email.substring(0, 10) + '...',
			});
			return null;
		}
	}

	/**
	 * Get user by ID
	 * @param userId User ID
	 * @returns User entity
	 */
	async getUserById(userId: string) {
		try {
			this.logger.userInfo('Getting user by ID', {
				context: 'UserService',
				userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			return user;
		} catch (error) {
			this.logger.userError('Failed to get user by ID', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			return null;
		}
	}

	/**
	 * Get user by reset token
	 * @param resetToken Reset token
	 * @returns User entity
	 */
	async getUserByResetToken(resetToken: string) {
		try {
			this.logger.userInfo('Getting user by reset token', {
				context: 'UserService',
				token: resetToken.substring(0, 10) + '...',
			});

			const user = await this.userRepository.findOne({ where: { resetPasswordToken: resetToken } });
			return user;
		} catch (error) {
			this.logger.userError('Failed to get user by reset token', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				token: resetToken.substring(0, 10) + '...',
			});
			return null;
		}
	}

	/**
	 * Find user by Google ID
	 * @param googleId Google ID
	 * @returns User entity
	 */
	async findByGoogleId(googleId: string) {
		try {
			this.logger.userInfo('Finding user by Google ID', {
				context: 'UserService',
				googleId: googleId.substring(0, 10) + '...',
			});

			const user = await this.userRepository.findOne({ where: { googleId } });
			return user;
		} catch (error) {
			this.logger.userError('Failed to find user by Google ID', {
				context: 'UserService',
				error: error instanceof Error ? error.message : 'Unknown error',
				googleId: googleId.substring(0, 10) + '...',
			});
			return null;
		}
	}

	/**
	 * Create new user
	 * @param userData User data
	 * @returns Created user
	 */
	async createUser(userData: {
		username: string;
		email: string;
		passwordHash: string;
		firstName?: string;
		lastName?: string;
		role?: 'user' | 'admin' | 'guest';
	}) {
		try {
			this.logger.userInfo('Creating new user', {
				email: userData.email,
				username: userData.username,
			});

			const user = this.userRepository.create({
				username: userData.username,
				email: userData.email,
				passwordHash: userData.passwordHash,
				firstName: userData.firstName,
				lastName: userData.lastName,
				role: userData.role || 'user',
			});

			const savedUser = await this.userRepository.save(user);
			this.logger.databaseCreate('user', { userId: savedUser.id, email: savedUser.email });
			return savedUser;
		} catch (error) {
			this.logger.userError('Failed to create user', {
				email: userData.email,
				username: userData.username,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Create Google user
	 * @param userData Google user data
	 * @returns Created user
	 */
	async createGoogleUser(userData: {
		googleId: string;
		email: string;
		fullName?: string;
		username: string;
		avatar?: string;
	}) {
		try {
			this.logger.userInfo('Creating Google user', {
				googleId: userData.googleId,
				email: userData.email,
			});

			const user = this.userRepository.create({
				googleId: userData.googleId,
				email: userData.email,
				fullName: userData.fullName,
				username: userData.username,
				avatar: userData.avatar,
				role: 'user',
			});

			const savedUser = await this.userRepository.save(user);
			this.logger.databaseCreate('google_user', { userId: savedUser.id, email: savedUser.email });
			return savedUser;
		} catch (error) {
			this.logger.userError('Failed to create Google user', {
				googleId: userData.googleId,
				email: userData.email,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Link Google account to existing user
	 * @param userId User ID
	 * @param googleId Google ID
	 * @returns Updated user
	 */
	async linkGoogleAccount(userId: string, googleId: string) {
		try {
			this.logger.userInfo('Linking Google account', {
				userId,
				googleId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			user.googleId = googleId;
			const updatedUser = await this.userRepository.save(user);
			return updatedUser;
		} catch (error) {
			this.logger.userError('Failed to link Google account', {
				userId,
				googleId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Log user activity for audit purposes
	 * @param userId User ID
	 * @param action Action performed
	 * @param details Additional details
	 * @returns Log result
	 */
	async logUserActivity(userId: string, action: string, details: Record<string, unknown> = {}) {
		try {
			const auditKey = `audit_log:${userId}:${Date.now()}`;
			const auditEntry = {
				userId,
				action,
				details,
				timestamp: new Date().toISOString(),
				ip: details.ip || 'unknown',
				userAgent: details.userAgent || 'unknown',
			};

			// Store audit log in persistent storage (survives cache invalidation)
			const result = await this.storageService.setItem(
				auditKey,
				auditEntry,
				2592000 // 30 days TTL for audit logs
			);

			if (!result.success) {
				this.logger.userWarn('Failed to store audit log', {
					userId,
					action,
					error: result.error || 'Unknown error',
				});
			}

			return {
				success: result.success,
				auditId: auditKey,
			};
		} catch (error) {
			this.logger.userError('Failed to log user activity', {
				userId,
				action,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Get user audit logs
	 * @param userId User ID
	 * @param limit Number of logs to return
	 * @returns User audit logs
	 */
	async getUserAuditLogs(userId: string, limit: number = 50) {
		try {
			this.logger.userInfo('Getting user audit logs', {
				userId,
				limit,
			});

			// Get all audit keys for this user
			const keysResult = await this.storageService.getKeys();
			if (!keysResult.success) {
				throw new Error('Failed to get audit keys');
			}

			const auditKeys =
				keysResult.data
					?.filter(key => key.startsWith(`audit_log:${userId}:`))
					.sort()
					.reverse()
					.slice(0, limit) || [];

			// Get audit entries
			const auditLogs = [];
			for (const key of auditKeys) {
				const result = await this.storageService.getItem(key);
				if (result.success && result.data) {
					auditLogs.push(result.data);
				}
			}

			return {
				success: true,
				logs: auditLogs,
				total: auditLogs.length,
			};
		} catch (error) {
			this.logger.userError('Failed to get user audit logs', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
