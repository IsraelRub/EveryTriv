import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DeepPartial, Repository } from 'typeorm';

import { CACHE_DURATION, DEFAULT_USER_PREFERENCES, HTTP_ERROR_MESSAGES, UserRole, UserStatus } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type {
	AdminUserData,
	AuditLogEntry,
	BasicValue,
	UpdateUserProfileData,
	UserPreferences,
	UserSearchCacheEntry,
} from '@shared/types';
import {
	getErrorMessage,
	isAuditLogEntry,
	isUserSearchCacheEntry,
	mergeUserPreferences,
	normalizeText,
} from '@shared/utils';

import { UserEntity } from '@internal/entities';
import { CacheService, ServerStorageService } from '@internal/modules';
import { createNotFoundError, createServerError, createValidationError } from '@internal/utils';

import { AuthenticationManager, PasswordService, ValidationService } from '../../common';
import { addSearchConditions } from '../../common/queries';

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
		private readonly passwordService: PasswordService,
		private readonly validationService: ValidationService
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
				{ email: user.email, password },
				{
					id: user.id,
					email: user.email,
					passwordHash: user.passwordHash,
					role: user.role,
					isActive: user.isActive,
				}
			);

			if (authResult.error) {
				throw new UnauthorizedException(authResult.error ?? 'Invalid credentials');
			}

			// Type guard: we know these exist when there's no error
			if (!authResult.accessToken || !authResult.refreshToken) {
				throw new UnauthorizedException('Authentication result incomplete');
			}

			// Update lastLogin timestamp
			user.lastLogin = new Date();
			await this.userRepository.save(user);

			const sessionKey = `user_session:${user.id}`;
			const result = await this.storageService.set(
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
					error: result.error ?? HTTP_ERROR_MESSAGES.UNKNOWN_ERROR,
				});
			}

			return {
				user: {
					id: user.id,
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
	async register(registerData: { email: string; password: string; firstName?: string; lastName?: string }) {
		try {
			logger.userInfo('User registration attempt', {
				email: registerData.email,
			});

			const existingEmail = await this.getUserByEmail(registerData.email);
			if (existingEmail) {
				throw new BadRequestException('Email already registered');
			}

			const passwordHash = await this.passwordService.hashPassword(registerData.password);

			const user = await this.createUser({
				email: registerData.email,
				passwordHash,
				firstName: registerData.firstName,
				lastName: registerData.lastName,
			});

			const tokenPair = await this.authenticationManager.generateTokensForUser({
				id: user.id,
				email: user.email,
				role: user.role,
			});

			return {
				user: {
					id: user.id,
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
				throw createNotFoundError('User');
			}

			return {
				id: user.id,
				email: user.email,
				role: user.role,
				firstName: user.firstName,
				lastName: user.lastName,
				avatar: user.avatar,
				preferences: user.preferences,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
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
	async updateUserProfile(userId: string, profileData: UpdateUserProfileData) {
		try {
			logger.userInfo('Updating user profile', {
				context: 'UserService',
				userId,
				fields: Object.keys(profileData),
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			// Update user fields
			if (profileData.firstName !== undefined) user.firstName = profileData.firstName;
			if (profileData.lastName !== undefined) user.lastName = profileData.lastName;
			if (profileData.avatar !== undefined) user.avatar = profileData.avatar;
			if (profileData.preferences !== undefined)
				user.preferences = mergeUserPreferences(user.preferences, profileData.preferences);

			// Save updated user
			const updatedUser = await this.userRepository.save(user);

			// Invalidate user profile cache
			await this.cacheService.delete(`user:profile:${userId}`);
			await this.cacheService.delete(`user:stats:${userId}`);

			return {
				id: updatedUser.id,
				email: updatedUser.email,
				role: updatedUser.role,
				firstName: updatedUser.firstName,
				lastName: updatedUser.lastName,
				avatar: updatedUser.avatar,
				preferences: updatedUser.preferences,
				createdAt: updatedUser.createdAt,
				updatedAt: updatedUser.updatedAt,
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
	 * Search users
	 * @param query Search query
	 * @param limit Number of results to return
	 * @returns Search results
	 */
	async searchUsers(query: string, limit: number = 10): Promise<UserSearchCacheEntry> {
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

			return await this.cacheService.getOrSet<UserSearchCacheEntry>(
				cacheKey,
				async () => {
					const queryBuilder = this.userRepository.createQueryBuilder('user');
					addSearchConditions(queryBuilder, 'user', ['email', 'firstName', 'lastName'], normalizedQuery, {
						wildcardPattern: 'both',
					});
					queryBuilder
						.andWhere('user.is_active = :isActive', { isActive: true })
						.select(['user.id', 'user.email', 'user.firstName', 'user.lastName', 'user.avatar'])
						.limit(limit);

					const users = await queryBuilder.getMany();

					return {
						query,
						results: users.map(user => ({
							id: user.id,
							email: user.email,
							firstName: user.firstName ?? null,
							lastName: user.lastName ?? null,
							avatar: user.avatar ?? null,
							displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
						})),
						totalResults: users.length,
					};
				},
				CACHE_DURATION.MEDIUM,
				isUserSearchCacheEntry
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
				throw createNotFoundError('User');
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
	 * Change user password
	 * @param userId User ID
	 * @param currentPassword Current password
	 * @param newPassword New password
	 * @returns Change result
	 */
	async changePassword(userId: string, currentPassword: string, newPassword: string) {
		try {
			logger.userInfo('Changing user password', {
				context: 'UserService',
				userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			// Verify current password
			if (!user.passwordHash) {
				throw new BadRequestException('Password not set');
			}
			const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
			if (!isCurrentPasswordValid) {
				throw new UnauthorizedException('Current password is incorrect');
			}

			// Hash new password
			const newPasswordHash = await bcrypt.hash(newPassword, 10);

			// Update password
			user.passwordHash = newPasswordHash;
			await this.userRepository.save(user);

			// Clear user cache
			await this.cacheService.delete(`user:profile:${userId}`);

			return {
				message: 'Password changed successfully',
			};
		} catch (error) {
			logger.userError('Failed to change password', {
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
	async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
		try {
			logger.userInfo('Updating user preferences', {
				context: 'UserService',
				userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			// Merge existing preferences with new ones (deep merge for privacy and game)
			user.preferences = mergeUserPreferences(user.preferences, preferences);
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
				throw createNotFoundError('User');
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
		email: string;
		passwordHash: string;
		firstName?: string;
		lastName?: string;
		role?: UserRole;
	}) {
		try {
			logger.userInfo('Creating new user', {
				email: userData.email,
			});

			const user = this.userRepository.create({
				email: userData.email,
				passwordHash: userData.passwordHash,
				firstName: userData.firstName,
				lastName: userData.lastName,
				role: userData.role ?? UserRole.USER,
			});

			const savedUser = await this.userRepository.save(user);
			logger.databaseCreate('user', { userId: savedUser.id, email: savedUser.email });
			return savedUser;
		} catch (error) {
			logger.userError('Failed to create user', {
				email: userData.email,
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
		firstName?: string;
		lastName?: string;
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
				firstName: userData.firstName,
				lastName: userData.lastName,
				avatar: userData.avatar,
				role: UserRole.USER,
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
				throw createNotFoundError('User');
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
	async logUserActivity(userId: string, action: string, details: { ip?: string; userAgent?: string } = {}) {
		try {
			const auditKey = `audit_log:${userId}:${Date.now()}`;
			const auditEntry = {
				userId,
				action,
				timestamp: new Date().toISOString(),
				ip: details.ip ?? 'unknown',
				userAgent: details.userAgent ?? 'unknown',
			};

			// Store audit log in persistent storage (survives cache invalidation)
			const result = await this.storageService.set(
				auditKey,
				auditEntry,
				2592000 // 30 days TTL for audit logs
			);

			if (!result.success) {
				logger.userWarn('Failed to store audit log', {
					userId,
					action,
					error: result.error ?? HTTP_ERROR_MESSAGES.UNKNOWN_ERROR,
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

			const auditKeys = (keysResult.data ?? [])
				.filter((key: string) => key.startsWith(`audit_log:${userId}:`))
				.sort()
				.reverse()
				.slice(0, limit);

			// Get audit entries
			const auditLogs: AuditLogEntry[] = [];
			for (const key of auditKeys) {
				const result = await this.storageService.get(key, isAuditLogEntry);
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
	async updateUserField(userId: string, field: string, value: BasicValue): Promise<UserEntity> {
		try {
			logger.userInfo('Updating user field', {
				context: 'UserService',
				userId,
				field,
			});
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			// Field type mapping for validation
			const fieldTypeMap: Record<
				string,
				{ type: 'string' | 'number' | 'boolean'; fieldName?: string; minLength?: number; maxLength?: number }
			> = {
				email: { type: 'string' },
				firstName: { type: 'string' },
				lastName: { type: 'string' },
				avatar: { type: 'string' },
				isActive: { type: 'boolean' },
				credits: { type: 'number' },
				purchasedCredits: { type: 'number' },
				dailyFreeQuestions: { type: 'number' },
				remainingFreeQuestions: { type: 'number' },
			};

			// Handle special fields
			if (field === 'role') {
				const validRole = Object.values(UserRole).find(role => role === value);
				if (validRole) {
					user.role = validRole;
				} else {
					throw createValidationError('role', 'string');
				}
			} else if (field === 'currentSubscriptionId') {
				if (typeof value === 'string' || value === null || value === undefined) {
					user.currentSubscriptionId = typeof value === 'string' ? value : undefined;
				} else {
					throw createValidationError('currentSubscriptionId', 'string');
				}
			} else if (field === 'status') {
				if (typeof value !== 'string') {
					throw createValidationError('status', 'string');
				}
				const nextStatus = Object.values(UserStatus).find(statusOption => statusOption === value);
				if (!nextStatus) {
					throw createValidationError('status', 'string');
				}
				user.isActive = nextStatus === UserStatus.ACTIVE;
			} else {
				// Use field type mapping for standard fields
				if (fieldTypeMap[field]) {
					const fieldConfig = fieldTypeMap[field];

					// Get target field name
					const targetField = fieldConfig.fieldName || field;

					// Use ValidationService to validate and set field based on type
					switch (fieldConfig.type) {
						case 'string':
							this.validationService.validateAndSetStringField(
								user,
								targetField,
								value,
								fieldConfig.minLength,
								fieldConfig.maxLength
							);
							break;
						case 'number':
							this.validationService.validateAndSetNumberField(user, targetField, value);
							break;
						case 'boolean':
							this.validationService.validateAndSetBooleanField(user, targetField, value);
							break;
						default:
							throw createValidationError(field, fieldConfig.type);
					}
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
	async updateSinglePreference(userId: string, preference: string, value: BasicValue): Promise<UserEntity> {
		try {
			logger.userInfo('Updating single preference', {
				context: 'UserService',
				userId,
				preference,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
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
				throw createNotFoundError('User');
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
	async updateUserStatus(userId: string, status: UserStatus): Promise<UserEntity> {
		try {
			logger.userInfo('Updating user status', {
				context: 'UserService',
				userId,
				status,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			// Update status by mapping to isActive field
			if (status === UserStatus.ACTIVE) {
				user.isActive = true;
			} else if (status === UserStatus.SUSPENDED || status === UserStatus.BANNED) {
				user.isActive = false;
			}

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
	 * Get all users for admin view
	 * @param limit Maximum number of users
	 * @param offset Number of users to skip
	 */
	async getAllUsers(
		limit: number = 50,
		offset: number = 0
	): Promise<{
		users: AdminUserData[];
		total: number;
		limit: number;
		offset: number;
	}> {
		const safeLimit = Math.min(Math.max(limit, 1), 200);
		const safeOffset = Math.max(offset, 0);

		const [users, total] = await this.userRepository.findAndCount({
			order: { createdAt: 'DESC' },
			take: safeLimit,
			skip: safeOffset,
		});

		const mapped: AdminUserData[] = users.map(user => ({
			id: user.id,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
			lastLogin: user.lastLogin ? user.lastLogin.toISOString() : undefined,
		}));

		return {
			users: mapped,
			total,
			limit: safeLimit,
			offset: safeOffset,
		};
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
				throw createNotFoundError('User');
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
