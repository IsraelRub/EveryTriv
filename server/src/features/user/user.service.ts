import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import {
	DEFAULT_USER_PREFERENCES,
	ERROR_CODES,
	ERROR_MESSAGES,
	SERVER_CACHE_KEYS,
	TIME_DURATIONS_SECONDS,
	UserRole,
	UserStatus,
	VALID_USER_STATUSES,
	VALIDATION_COUNT,
	VALIDATORS,
} from '@shared/constants';
import type {
	BasicValue,
	DeductCreditsResponse,
	UpdateCreditsData,
	UpdateUserProfileData,
	UserPreferences,
	UserSearchCacheEntry,
} from '@shared/types';
import {
	getErrorMessage,
	isAuditLogEntry,
	isOneOf,
	isUserSearchCacheEntry,
	mergeUserPreferences,
	normalizeText,
} from '@shared/utils';

import { WildcardPattern } from '@internal/constants';
import { UserEntity } from '@internal/entities';
import { CacheService, StorageService, UserCoreService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { UserFieldConfig } from '@internal/types';
import { addSearchConditions, createNotFoundError, createServerError, createValidationError } from '@internal/utils';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly cacheService: CacheService,
		private readonly storageService: StorageService,
		private readonly userCoreService: UserCoreService
	) {}

	async getUserProfile(userId: string) {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Get avatar from preferences
			const avatar = user.preferences?.avatar;

			// Return in UserProfileResponseType format
			return {
				profile: {
					id: user.id,
					email: user.email,
					role: user.role,
					firstName: user.firstName,
					lastName: user.lastName,
					avatar: avatar,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
				},
				preferences: user.preferences ?? {},
			};
		} catch (error) {
			logger.userError('Failed to get user profile', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async updateUserProfile(userId: string, profileData: UpdateUserProfileData) {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Update user fields
			// Note: avatar is updated only through setAvatar() method (separate endpoint)
			if (profileData.firstName !== undefined) user.firstName = profileData.firstName;
			if (profileData.lastName !== undefined) {
				user.lastName = profileData.lastName ?? undefined;
			}
			if (profileData.preferences !== undefined) {
				user.preferences = mergeUserPreferences(user.preferences, profileData.preferences);
			}

			// Save updated user
			const updatedUser = await this.userRepository.save(user);

			// Invalidate user profile cache
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.PROFILE(userId));
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.STATS(userId));

			// Return in UserProfileResponseType format
			return {
				profile: {
					id: updatedUser.id,
					email: updatedUser.email,
					role: updatedUser.role,
					firstName: updatedUser.firstName,
					lastName: updatedUser.lastName,
					avatar: updatedUser.preferences?.avatar,
					createdAt: updatedUser.createdAt,
					updatedAt: updatedUser.updatedAt,
				},
				preferences: updatedUser.preferences ?? {},
			};
		} catch (error) {
			logger.userError('Failed to update user profile', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async setAvatar(userId: string, avatarId: number) {
		try {
			// Validate avatar ID
			const { MIN, MAX } = VALIDATION_COUNT.AVATAR_ID;
			if (!Number.isInteger(avatarId) || avatarId < MIN || avatarId > MAX) {
				throw new BadRequestException(ERROR_CODES.AVATAR_ID_OUT_OF_RANGE);
			}

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Store avatarId as number in preferences
			user.preferences = mergeUserPreferences(user.preferences, {
				avatar: avatarId,
			});
			const updatedUser = await this.userRepository.save(user);

			// Invalidate user profile cache
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.PROFILE(userId));
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.STATS(userId));

			// Return in UserProfileResponseType format
			return {
				profile: {
					id: updatedUser.id,
					email: updatedUser.email,
					role: updatedUser.role,
					firstName: updatedUser.firstName,
					lastName: updatedUser.lastName,
					avatar: updatedUser.preferences?.avatar,
					createdAt: updatedUser.createdAt,
					updatedAt: updatedUser.updatedAt,
				},
				preferences: updatedUser.preferences ?? {},
			};
		} catch (error) {
			logger.userError('Failed to set user avatar', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				userId,
				avatar: avatarId,
			});
			throw error;
		}
	}

	async searchUsers(query: string, limit: number = 10): Promise<UserSearchCacheEntry> {
		try {
			// Normalize search query
			const normalizedQuery = normalizeText(query);
			if (!normalizedQuery || normalizedQuery.length < 2) {
				throw new BadRequestException(ERROR_CODES.SEARCH_QUERY_TOO_SHORT);
			}

			const cacheKey = SERVER_CACHE_KEYS.USER.SEARCH(normalizedQuery, limit);

			return await this.cacheService.getOrSet<import('@internal/types').UserSearchCacheEntry>(
				cacheKey,
				async () => {
					const queryBuilder = this.userRepository.createQueryBuilder('user');
					addSearchConditions(queryBuilder, 'user', ['email', 'firstName', 'lastName'], normalizedQuery, {
						wildcardPattern: WildcardPattern.BOTH,
					});
					queryBuilder
						.andWhere('user.is_active = :isActive', { isActive: true })
						.select(['user.id', 'user.email', 'user.firstName', 'user.lastName', 'user.preferences'])
						.limit(limit);

					const users = await queryBuilder.getMany();

					return {
						query,
						results: users.map(user => ({
							id: user.id,
							email: user.email,
							firstName: user.firstName ?? null,
							lastName: user.lastName ?? null,
							avatar: user.preferences?.avatar ?? null,
							displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
						})),
						totalResults: users.length,
					};
				},
				TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES,
				isUserSearchCacheEntry
			);
		} catch (error) {
			logger.userError('Failed to search users', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				query,
			});
			throw error;
		}
	}

	async deleteUserAccount(userId: string): Promise<string> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Soft delete by setting is_active to false
			user.isActive = false;
			await this.userRepository.save(user);

			// Invalidate all user-related cache
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.PROFILE(userId));
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.STATS(userId));
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.CREDITS(userId));

			return 'Account deleted successfully';
		} catch (error) {
			logger.userError('Failed to delete user account', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Merge existing preferences with new ones (deep merge for privacy and game)
			user.preferences = mergeUserPreferences(user.preferences, preferences);

			await this.userRepository.save(user);

			// Invalidate user profile cache
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.PROFILE(userId));

			return {
				message: 'Preferences updated successfully',
				preferences: user.preferences,
			};
		} catch (error) {
			logger.userError('Failed to update user preferences', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async updateUser(userId: string, updates: DeepPartial<UserEntity>): Promise<UserEntity> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Apply updates
			Object.assign(user, updates);
			const updatedUser = await this.userRepository.save(user);

			// Invalidate user cache
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.PROFILE(userId));
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.STATS(userId));

			return updatedUser;
		} catch (error) {
			logger.userError('Failed to update user', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	async getUserByEmail(email: string) {
		return this.userCoreService.getUserByEmail(email);
	}

	async getUserById(userId: string) {
		return this.userCoreService.getUserById(userId);
	}

	async findByGoogleId(googleId: string) {
		try {
			const user = await this.userRepository.findOne({ where: { googleId } });
			return user;
		} catch (error) {
			logger.userError('Failed to find user by Google ID', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				googleId: googleId.substring(0, 10) + '...',
			});
			return null;
		}
	}

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
			const result = await this.storageService.set(auditKey, auditEntry, TIME_DURATIONS_SECONDS.MONTH);

			if (!result.success) {
				logger.userWarn('Failed to store audit log', {
					userId,
					action,
					errorInfo: {
						message: result.error ?? ERROR_MESSAGES.general.UNKNOWN_ERROR,
					},
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
				errorInfo: { message: getErrorMessage(error) },
			});
			return {
				success: false,
				errorInfo: { message: getErrorMessage(error) },
			};
		}
	}

	async getUserAuditLogs(userId: string, limit: number = 50) {
		try {
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
			const auditLogs: import('@internal/types').AuditLogEntry[] = [];
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
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async updateUserField(userId: string, field: string, value: BasicValue): Promise<UserEntity> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Field type mapping for validation
			const fieldTypeMap: Record<string, UserFieldConfig> = {
				email: { type: 'string' },
				firstName: { type: 'string' },
				lastName: { type: 'string' },
				avatar: { type: 'number' },
				isActive: { type: 'boolean' },
				credits: { type: 'number' },
				purchasedCredits: { type: 'number' },
				dailyFreeQuestions: { type: 'number' },
				remainingFreeQuestions: { type: 'number' },
			};

			// Handle special fields
			switch (field) {
				case 'role': {
					const isUserRole = isOneOf(Object.values(UserRole));
					if (isUserRole(value)) {
						user.role = value;
					} else {
						throw createValidationError('role', 'string');
					}
					break;
				}
				case 'status': {
					const isValidStatus = isOneOf(VALID_USER_STATUSES);
					if (isValidStatus(value)) {
						user.isActive = value === UserStatus.ACTIVE;
					} else {
						throw createValidationError('status', 'string');
					}
					break;
				}
				default: {
					// Use field type mapping for standard fields
					if (fieldTypeMap[field]) {
						const fieldConfig = fieldTypeMap[field];

						// Get target field name
						const targetField = fieldConfig.fieldName ?? field;

						// Validate and set field based on type
						switch (fieldConfig.type) {
							case 'string':
								this.validateAndSetStringField(user, targetField, value, fieldConfig.minLength, fieldConfig.maxLength);
								break;
							case 'number':
								this.validateAndSetNumberField(user, targetField, value);
								break;
							case 'boolean':
								this.validateAndSetBooleanField(user, targetField, value);
								break;
							default:
								throw createValidationError(field, fieldConfig.type);
						}
					} else {
						throw createValidationError(field, 'string');
					}
				}
			}
			const updatedUser = await this.userRepository.save(user);

			return updatedUser;
		} catch (error) {
			logger.userError('Failed to update user field', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				userId,
				fields: [field],
			});
			throw error;
		}
	}

	async updateSinglePreference(userId: string, preference: string, value: BasicValue): Promise<UserEntity> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
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
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.PROFILE(userId));

			return updatedUser;
		} catch (error) {
			logger.userError('Failed to update single preference', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				userId,
				preference,
			});
			throw error;
		}
	}

	async updateUserCredits(data: UpdateCreditsData): Promise<UserEntity> {
		try {
			const user = await this.userRepository.findOne({
				where: { id: data.userId },
			});
			if (!user) {
				throw createNotFoundError('User');
			}

			// Update credits
			user.credits = (user.credits ?? 0) + data.amount;

			// Ensure credits don't go below 0
			if (user.credits < 0) {
				user.credits = 0;
			}

			const updatedUser = await this.userRepository.save(user);

			// Invalidate user credits cache
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.CREDITS(data.userId));
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.STATS(data.userId));

			return updatedUser;
		} catch (error) {
			logger.userError('Failed to update user credits', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				userId: data.userId,
				amount: data.amount,
			});
			throw error;
		}
	}

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
			switch (status) {
				case UserStatus.ACTIVE:
					user.isActive = true;
					break;
				case UserStatus.SUSPENDED:
				case UserStatus.BANNED:
					user.isActive = false;
					break;
			}

			const updatedUser = await this.userRepository.save(user);

			// Invalidate user cache
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.PROFILE(userId));
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.STATS(userId));

			return updatedUser;
		} catch (error) {
			logger.userError('Failed to update user status', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				userId,
				status,
			});
			throw error;
		}
	}

	async getAllUsers(limit: number = 50, offset: number = 0) {
		return this.userCoreService.getAllUsers(limit, offset);
	}

	async deductCredits(data: UpdateCreditsData): Promise<DeductCreditsResponse> {
		try {
			const user = await this.userRepository.findOne({
				where: { id: data.userId },
				select: ['id', 'credits'],
			});

			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			const currentCredits = user.credits ?? 0;
			if (currentCredits < data.amount) {
				throw new BadRequestException(ERROR_CODES.INSUFFICIENT_CREDITS);
			}

			const newCredits = currentCredits - data.amount;
			user.credits = newCredits;
			await this.userRepository.save(user);

			// Invalidate user credits cache
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.CREDITS(data.userId));
			await this.cacheService.delete(SERVER_CACHE_KEYS.USER.STATS(data.userId));

			return {
				success: true,
				credits: newCredits,
				deducted: data.amount,
			};
		} catch (error) {
			logger.userError('Failed to deduct credits', {
				context: 'UserService',
				errorInfo: { message: getErrorMessage(error) },
				userId: data.userId,
				amount: data.amount,
				reason: data.reason,
			});
			throw error;
		}
	}

	private validateAndSetStringField(
		user: UserEntity,
		field: string,
		value: BasicValue,
		minLength?: number,
		maxLength?: number
	): void {
		if (!VALIDATORS.string(value)) {
			throw createValidationError(field, 'string');
		}

		if (minLength !== undefined && value.length < minLength) {
			throw createValidationError(field, 'string');
		}

		if (maxLength !== undefined && value.length > maxLength) {
			throw createValidationError(field, 'string');
		}

		Object.assign(user, { [field]: value });
	}

	private validateAndSetNumberField(user: UserEntity, field: string, value: BasicValue): void {
		if (!VALIDATORS.number(value)) {
			throw createValidationError(field, 'number');
		}

		Object.assign(user, { [field]: value });
	}

	private validateAndSetBooleanField(user: UserEntity, field: string, value: BasicValue): void {
		if (!VALIDATORS.boolean(value)) {
			throw createValidationError(field, 'boolean');
		}

		Object.assign(user, { [field]: value });
	}
}
