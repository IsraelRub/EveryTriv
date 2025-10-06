import {
	DEFAULT_USER_PREFERENCES,
	PreferenceValue,
	UserAddress,
	UserFieldUpdate,
	UserPreferences,
	createServerError,
	createValidationError,
	getErrorMessage,
	serverLogger as logger,
	normalizeText,
} from '@shared';
import { UserEntity } from 'src/internal/entities';
import { CacheService } from 'src/internal/modules/cache';
import { ServerStorageService } from 'src/internal/modules/storage';
import { DeepPartial, Repository } from 'typeorm';

import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AuthenticationManager } from '../../common/auth/authentication.manager';
import { PasswordService } from '../../common/auth/password.service';

/**
 * Service for managing user data, profiles, and authentication
 * Handles user CRUD operations, profile management, user statistics, and authentication
 */
@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly cacheService: CacheService,
		private readonly storageService: ServerStorageService,
		private readonly authenticationManager: AuthenticationManager,
		private readonly passwordService: PasswordService
	) {}

	/**
	 * Login user
	 * @param email User email
	 * @param password User password
	 * @returns Login result
	 */
	async login(email: string, password: string) {
		try {
			logger.securityLogin('User login attempt', {
				context: 'UserService',
				email: email.substring(0, 10) + '...',
			});

			const user = await this.getUserByEmail(email);
			if (!user || !user.isActive || !user.passwordHash) {
				throw new UnauthorizedException('Invalid credentials');
			}

			const authResult = await this.authenticationManager.authenticate(
				{ username: user.username, password },
				{
					id: user.id,
					username: user.username,
					email: user.email,
					passwordHash: user.passwordHash,
					role: user.role,
					isActive: user.isActive,
				}
			);

			if (!authResult.success) {
				throw new UnauthorizedException(authResult.error ?? 'Invalid credentials');
			}

			// Type guard: we know these exist when success is true
			if (!authResult.accessToken || !authResult.refreshToken) {
				throw new UnauthorizedException('Authentication result incomplete');
			}

			const sessionKey = `user_session:${user.id}`;
			const result = await this.storageService.setItem(
				sessionKey,
				{
					userId: user.id,
					lastLogin: new Date().toISOString(),
					accessToken: authResult.accessToken.substring(0, 20) + '...',
				},
				86400
			);

			if (!result.success) {
				logger.userWarn('Failed to store user session data', {
					context: 'UserService',
					userId: user.id,
					error: result.error ?? 'Unknown error',
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
				accessToken: authResult.accessToken,
				refreshToken: authResult.refreshToken,
				message: 'Login successful',
			};
		} catch (error) {
			logger.securityDenied('Login failed', {
				context: 'UserService',
				error: getErrorMessage(error),
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
			logger.userInfo('User registration attempt', {
				email: registerData.email,
				username: registerData.username,
			});

			const existingEmail = await this.getUserByEmail(registerData.email);
			if (existingEmail) {
				throw new BadRequestException('Email already registered');
			}

			const passwordHash = await this.passwordService.hashPassword(registerData.password);

			const user = await this.createUser({
				username: registerData.username,
				email: registerData.email,
				passwordHash,
				firstName: registerData.firstName,
				lastName: registerData.lastName,
			});

			const tokenPair = await this.authenticationManager.generateTokensForUser({
				id: user.id,
				username: user.username,
				email: user.email,
				role: user.role,
			});

			return {
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					avatar: user.avatar,
					role: user.role,
				},
				accessToken: tokenPair.accessToken,
				refreshToken: tokenPair.refreshToken,
				message: 'Registration successful',
			};
		} catch (error) {
			logger.userError('Registration failed', {
				email: registerData.email,
				username: registerData.username,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Get user profile by ID
	 * @param userId User ID
	 * @returns User profile
	 */
	async getUserProfile(userId: string) {
		try {
			logger.userInfo('Getting user profile', {
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
			logger.userError('Failed to get user profile', {
				context: 'UserService',
				error: getErrorMessage(error),
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
			logger.userInfo('Updating user profile', {
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

			// Invalidate user profile cache
			await this.cacheService.delete(`user:profile:${userId}`);
			await this.cacheService.delete(`user:stats:${userId}`);

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
			logger.userError('Failed to update user profile', {
				context: 'UserService',
				error: getErrorMessage(error),
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
			logger.userInfo('Getting user stats', {
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
						stats: user.stats ?? {},
						created_at: user.createdAt,
						accountAge: user.createdAt
							? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
							: 0,
					};
				},
				1800 // Cache for 30 minutes - user stats don't change frequently
			);
		} catch (error) {
			logger.userError('Failed to get user stats', {
				context: 'UserService',
				error: getErrorMessage(error),
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
			logger.userInfo('Searching users', {
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
			logger.userError('Failed to search users', {
				context: 'UserService',
				error: getErrorMessage(error),
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
			logger.userInfo('Getting user by username', {
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
			logger.userError('Failed to get user by username', {
				context: 'UserService',
				error: getErrorMessage(error),
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
			logger.userInfo('Deleting user account', {
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

			// Invalidate all user-related cache
			await this.cacheService.delete(`user:profile:${userId}`);
			await this.cacheService.delete(`user:stats:${userId}`);
			await this.cacheService.delete(`user:credits:${userId}`);

			return {
				message: 'Account deleted successfully',
			};
		} catch (error) {
			logger.userError('Failed to delete user account', {
				context: 'UserService',
				error: getErrorMessage(error),
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
	async updateUserPreferences(userId: string, preferences: Record<string, unknown>) {
		try {
			logger.userInfo('Updating user preferences', {
				context: 'UserService',
				userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Merge existing preferences with new ones
			user.preferences = {
				...user.preferences,
				...preferences,
			};
			await this.userRepository.save(user);

			// Invalidate user profile cache
			await this.cacheService.delete(`user:profile:${userId}`);

			return {
				message: 'Preferences updated successfully',
				preferences: user.preferences,
			};
		} catch (error) {
			logger.userError('Failed to update user preferences', {
				context: 'UserService',
				error: getErrorMessage(error),
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
	async updateUser(userId: string, updates: DeepPartial<UserEntity>): Promise<UserEntity> {
		try {
			logger.userInfo('Updating user', {
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

			// Invalidate user cache
			await this.cacheService.delete(`user:profile:${userId}`);
			await this.cacheService.delete(`user:stats:${userId}`);

			return updatedUser;
		} catch (error) {
			logger.userError('Failed to update user', {
				context: 'UserService',
				error: getErrorMessage(error),
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
			logger.userInfo('Getting user by email', {
				context: 'UserService',
				email: email.substring(0, 10) + '...',
			});

			const user = await this.userRepository.findOne({ where: { email } });
			return user;
		} catch (error) {
			logger.userError('Failed to get user by email', {
				context: 'UserService',
				error: getErrorMessage(error),
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
			logger.userInfo('Getting user by ID', {
				context: 'UserService',
				userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			return user;
		} catch (error) {
			logger.userError('Failed to get user by ID', {
				context: 'UserService',
				error: getErrorMessage(error),
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
			logger.userInfo('Getting user by reset token', {
				context: 'UserService',
				token: resetToken.substring(0, 10) + '...',
			});

			const user = await this.userRepository.findOne({ where: { resetPasswordToken: resetToken } });
			return user;
		} catch (error) {
			logger.userError('Failed to get user by reset token', {
				context: 'UserService',
				error: getErrorMessage(error),
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
			logger.userInfo('Finding user by Google ID', {
				context: 'UserService',
				googleId: googleId.substring(0, 10) + '...',
			});

			const user = await this.userRepository.findOne({ where: { googleId } });
			return user;
		} catch (error) {
			logger.userError('Failed to find user by Google ID', {
				context: 'UserService',
				error: getErrorMessage(error),
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
			logger.userInfo('Creating new user', {
				email: userData.email,
				username: userData.username,
			});

			const user = this.userRepository.create({
				username: userData.username,
				email: userData.email,
				passwordHash: userData.passwordHash,
				firstName: userData.firstName,
				lastName: userData.lastName,
				role: userData.role ?? 'user',
			});

			const savedUser = await this.userRepository.save(user);
			logger.databaseCreate('user', { userId: savedUser.id, email: savedUser.email });
			return savedUser;
		} catch (error) {
			logger.userError('Failed to create user', {
				email: userData.email,
				username: userData.username,
				error: getErrorMessage(error),
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
			logger.userInfo('Creating Google user', {
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
			logger.databaseCreate('google_user', { userId: savedUser.id, email: savedUser.email });
			return savedUser;
		} catch (error) {
			logger.userError('Failed to create Google user', {
				googleId: userData.googleId,
				email: userData.email,
				error: getErrorMessage(error),
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
			logger.userInfo('Linking Google account', {
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
			logger.userError('Failed to link Google account', {
				userId,
				googleId,
				error: getErrorMessage(error),
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
				ip: details.ip ?? 'unknown',
				userAgent: details.userAgent ?? 'unknown',
			};

			// Store audit log in persistent storage (survives cache invalidation)
			const result = await this.storageService.setItem(
				auditKey,
				auditEntry,
				2592000 // 30 days TTL for audit logs
			);

			if (!result.success) {
				logger.userWarn('Failed to store audit log', {
					userId,
					action,
					error: result.error ?? 'Unknown error',
				});
			}

			return {
				success: result.success,
				auditId: auditKey,
			};
		} catch (error) {
			logger.userError('Failed to log user activity', {
				userId,
				action,
				error: getErrorMessage(error),
			});
			return {
				success: false,
				error: getErrorMessage(error),
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
			logger.userInfo('Getting user audit logs', {
				userId,
				limit,
			});

			// Get all audit keys for this user
			const keysResult = await this.storageService.getKeys();
			if (!keysResult.success) {
				throw createServerError('get audit keys', keysResult.error);
			}

			const auditKeys =
				keysResult.data
					?.filter((key: string) => key.startsWith(`audit_log:${userId}:`))
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
				logs: auditLogs,
				total: auditLogs.length,
			};
		} catch (error) {
			logger.userError('Failed to get user audit logs', {
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Update specific user field
	 * @param userId User ID
	 * @param field Field name to update
	 * @param value New value
	 * @returns Updated user
	 */
	async updateUserField(
		userId: string,
		field: keyof UserFieldUpdate | 'role' | 'currentSubscriptionId' | 'status',
		value: PreferenceValue
	): Promise<UserEntity> {
		try {
			logger.userInfo('Updating user field', {
				context: 'UserService',
				userId,
				field,
			});
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Field type mapping for validation
			const fieldTypeMap: Record<
				string,
				{ type: 'string' | 'number' | 'boolean'; fieldName?: string; minLength?: number; maxLength?: number }
			> = {
				username: { type: 'string', minLength: 3 },
				email: { type: 'string' },
				firstName: { type: 'string' },
				lastName: { type: 'string' },
				phone: { type: 'string' },
				avatar: { type: 'string' },
				bio: { type: 'string', fieldName: 'additionalInfo', maxLength: 500 },
				additionalInfo: { type: 'string', maxLength: 500 },
				isActive: { type: 'boolean' },
				agreeToNewsletter: { type: 'boolean' },
				score: { type: 'number' },
				credits: { type: 'number' },
				points: { type: 'number' },
				purchasedPoints: { type: 'number' },
				dailyFreeQuestions: { type: 'number' },
				remainingFreeQuestions: { type: 'number' },
			};

			// Handle special fields that are not in UserFieldUpdate
			if (field === 'role') {
				if (value === 'admin' || value === 'user' || value === 'guest') {
					user.role = value;
				} else {
					throw createValidationError('role', 'string');
				}
			} else if (field === 'currentSubscriptionId') {
				if (typeof value === 'string' || !value) {
					user.currentSubscriptionId = value as string | undefined;
				} else {
					throw createValidationError('currentSubscriptionId', 'string');
				}
			} else if (field === 'status') {
				const currentAdditionalInfo = user.additionalInfo ? JSON.parse(user.additionalInfo) : {};
				user.additionalInfo = JSON.stringify({
					...currentAdditionalInfo,
					status: value,
					statusUpdatedAt: new Date().toISOString(),
				});
			} else {
				// Use field type mapping for standard fields in UserFieldUpdate
				if (fieldTypeMap[field]) {
					const fieldConfig = fieldTypeMap[field];
					const targetField = fieldConfig.fieldName || field; // Use fieldName if specified, otherwise use field key

					// Create update object with proper typing
					const updateData: Partial<UserEntity> = {};

					switch (fieldConfig.type) {
						case 'string':
							updateData[targetField as keyof UserEntity] = value as never;
							break;
						case 'number':
							updateData[targetField as keyof UserEntity] = Number(value) as never;
							break;
						case 'boolean':
							updateData[field as keyof UserEntity] = Boolean(value) as never;
							break;
					}

					// Apply the update using Object.assign
					Object.assign(user, updateData);
				} else {
					throw createValidationError(field, 'string');
				}
			}
			const updatedUser = await this.userRepository.save(user);

			return updatedUser;
		} catch (error) {
			logger.userError('Failed to update user field', {
				context: 'UserService',
				error: getErrorMessage(error),
				userId,
				field,
			});
			throw error;
		}
	}

	/**
	 * Update single preference
	 * @param userId User ID
	 * @param preference Preference name
	 * @param value New value
	 * @returns Updated user
	 */
	async updateSinglePreference(userId: string, preference: string, value: PreferenceValue): Promise<UserEntity> {
		try {
			logger.userInfo('Updating single preference', {
				context: 'UserService',
				userId,
				preference,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Initialize preferences if not exists
			if (!user.preferences) {
				user.preferences = DEFAULT_USER_PREFERENCES;
			}

			// Update the specific preference
			user.preferences = {
				...user.preferences,
				[preference]: value,
			};
			const updatedUser = await this.userRepository.save(user);

			// Invalidate user profile cache
			await this.cacheService.delete(`user:profile:${userId}`);

			return updatedUser;
		} catch (error) {
			logger.userError('Failed to update single preference', {
				context: 'UserService',
				error: getErrorMessage(error),
				userId,
				preference,
			});
			throw error;
		}
	}

	/**
	 * Update user credits
	 * @param userId User ID
	 * @param amount Amount to add/subtract
	 * @param reason Reason for credit change
	 * @returns Updated user
	 */
	async updateUserCredits(userId: string, amount: number, reason: string): Promise<UserEntity> {
		try {
			logger.userInfo('Updating user credits', {
				context: 'UserService',
				userId,
				amount,
				reason,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Update credits
			user.credits = (user.credits ?? 0) + amount;

			// Ensure credits don't go below 0
			if (user.credits < 0) {
				user.credits = 0;
			}

			const updatedUser = await this.userRepository.save(user);

			// Invalidate user credits cache
			await this.cacheService.delete(`user:credits:${userId}`);
			await this.cacheService.delete(`user:stats:${userId}`);

			// Log credit change
			logger.userInfo('User credits updated', {
				context: 'UserService',
				userId,
				oldCredits: (user.credits ?? 0) - amount,
				newCredits: updatedUser.credits,
				change: amount,
				reason,
			});

			return updatedUser;
		} catch (error) {
			logger.userError('Failed to update user credits', {
				context: 'UserService',
				error: getErrorMessage(error),
				userId,
				amount,
			});
			throw error;
		}
	}

	/**
	 * Update user status
	 * @param userId User ID
	 * @param status New status
	 * @returns Updated user
	 */
	async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned'): Promise<UserEntity> {
		try {
			logger.userInfo('Updating user status', {
				context: 'UserService',
				userId,
				status,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Update status by mapping to isActive field or storing in additionalInfo
			if (status === 'active') {
				user.isActive = true;
			} else if (status === 'suspended' || status === 'banned') {
				user.isActive = false;
			}

			// Store detailed status in additionalInfo
			const currentAdditionalInfo = user.additionalInfo ? JSON.parse(user.additionalInfo) : {};
			user.additionalInfo = JSON.stringify({
				...currentAdditionalInfo,
				status: status,
				statusUpdatedAt: new Date().toISOString(),
			});
			const updatedUser = await this.userRepository.save(user);

			// Invalidate user cache
			await this.cacheService.delete(`user:profile:${userId}`);
			await this.cacheService.delete(`user:stats:${userId}`);

			// Log status change
			logger.userInfo('User status updated', {
				context: 'UserService',
				userId,
				newStatus: status,
			});

			return updatedUser;
		} catch (error) {
			logger.userError('Failed to update user status', {
				context: 'UserService',
				error: getErrorMessage(error),
				userId,
				status,
			});
			throw error;
		}
	}

	/**
	 * Get user credits
	 * @param userId User ID
	 * @returns User credits
	 */
	async getUserCredits(userId: string): Promise<number> {
		try {
			const user = await this.userRepository.findOne({
				where: { id: userId },
				select: ['id', 'credits'],
			});

			if (!user) {
				throw new NotFoundException('User not found');
			}

			return user.credits ?? 0;
		} catch (error) {
			logger.userError('Failed to get user credits', {
				context: 'UserService',
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Deduct user credits
	 * @param userId User ID
	 * @param amount Amount to deduct
	 * @param reason Reason for deduction
	 * @returns Updated user credits
	 */
	async deductCredits(userId: string, amount: number, reason: string): Promise<{ credits: number; deducted: number }> {
		try {
			const user = await this.userRepository.findOne({
				where: { id: userId },
				select: ['id', 'credits'],
			});

			if (!user) {
				throw new NotFoundException('User not found');
			}

			const currentCredits = user.credits ?? 0;
			if (currentCredits < amount) {
				throw new BadRequestException('Insufficient credits');
			}

			const newCredits = currentCredits - amount;
			user.credits = newCredits;
			await this.userRepository.save(user);

			// Invalidate user credits cache
			await this.cacheService.delete(`user:credits:${userId}`);
			await this.cacheService.delete(`user:stats:${userId}`);

			logger.userInfo('Credits deducted', {
				context: 'UserService',
				userId,
				amount,
				reason,
				previousCredits: currentCredits,
				newCredits,
			});

			return {
				credits: newCredits,
				deducted: amount,
			};
		} catch (error) {
			logger.userError('Failed to deduct credits', {
				context: 'UserService',
				error: getErrorMessage(error),
				userId,
				amount,
				reason,
			});
			throw error;
		}
	}
}
