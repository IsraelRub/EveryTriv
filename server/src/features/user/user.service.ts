import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	DEFAULT_USER_PREFERENCES,
	ErrorCode,
	SERVER_CACHE_KEYS,
	TIME_DURATIONS_SECONDS,
	UserStatus,
	VALIDATION_COUNT,
} from '@shared/constants';
import type {
	BasicValue,
	DeductCreditsResponse,
	UpdateCreditsData,
	UpdateUserProfileData,
	UserPreferences,
	UserSearchCacheEntry,
} from '@shared/types';
import { getErrorMessage, mergeUserPreferences, normalizeText, sanitizeInput } from '@shared/utils';
import { isUserRole, isUserStatus, VALIDATORS } from '@shared/validation';

import { WildcardPattern } from '@internal/constants';
import { UserEntity } from '@internal/entities';
import { CacheService, UserCoreService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { UserFieldConfig } from '@internal/types';
import { addSearchConditions, createNotFoundError, createValidationError } from '@internal/utils';

import { isUserSearchCacheEntry } from '../../internal/utils/entityGuards';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly cacheService: CacheService,
		private readonly userCoreService: UserCoreService
	) {}

	async getUserProfile(userId: string) {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
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
				throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			if (profileData.firstName !== undefined) {
				user.firstName = sanitizeInput(profileData.firstName, 50) || undefined;
			}
			if (profileData.lastName !== undefined) {
				user.lastName = sanitizeInput(profileData.lastName ?? '', 50) || undefined;
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
			const { MIN, MAX } = VALIDATION_COUNT.AVATAR_ID;
			const isClear = avatarId === 0;
			if (!Number.isInteger(avatarId) || avatarId < 0 || (!isClear && (avatarId < MIN || avatarId > MAX))) {
				throw new BadRequestException(ErrorCode.AVATAR_ID_OUT_OF_RANGE);
			}

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			user.preferences = mergeUserPreferences(user.preferences, {
				avatar: isClear ? undefined : avatarId,
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
				throw new BadRequestException(ErrorCode.SEARCH_QUERY_TOO_SHORT);
			}

			const cacheKey = SERVER_CACHE_KEYS.USER.SEARCH(normalizedQuery, limit);

			return await this.cacheService.getOrSet<UserSearchCacheEntry>(
				cacheKey,
				async () => {
					const queryBuilder = this.userRepository.createQueryBuilder('user');
					addSearchConditions(queryBuilder, 'user', ['email', 'firstName', 'lastName'], normalizedQuery, {
						wildcardPattern: WildcardPattern.BOTH,
					});
					queryBuilder
						.andWhere('user.is_active = :isActive', { isActive: true })
						.select([
							'user.id',
							'user.email',
							'user.firstName',
							'user.lastName',
							'user.preferences',
							'user.role',
							'user.createdAt',
							'user.lastLogin',
						])
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
							role: user.role,
							createdAt: user.createdAt ? user.createdAt.toISOString() : undefined,
							lastLogin: user.lastLogin ? user.lastLogin.toISOString() : undefined,
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
				throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
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
				throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
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

	async getUserById(userId: string) {
		return this.userCoreService.getUserById(userId);
	}

	async updateUserField(userId: string, field: string, value: BasicValue): Promise<UserEntity> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
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
					if (isUserRole(value)) {
						user.role = value;
					} else {
						throw createValidationError('role', 'string');
					}
					break;
				}
				case 'status': {
					if (isUserStatus(value)) {
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
						const targetField = fieldConfig.fieldName ?? field;
						this.validateAndSetField(user, targetField, value, fieldConfig);
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
				throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
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

			user.credits = Math.max(0, (user.credits ?? 0) + data.amount);

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

			user.isActive = status === UserStatus.ACTIVE;

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
				throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			const currentCredits = user.credits ?? 0;
			if (currentCredits < data.amount) {
				throw new BadRequestException(ErrorCode.INSUFFICIENT_CREDITS);
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

	private validateAndSetField(user: UserEntity, fieldName: string, value: BasicValue, config: UserFieldConfig): void {
		const { type, minLength, maxLength } = config;
		switch (type) {
			case 'string': {
				if (
					!VALIDATORS.string(value) ||
					(minLength !== undefined && value.length < minLength) ||
					(maxLength !== undefined && value.length > maxLength)
				)
					throw createValidationError(fieldName, type);
				break;
			}
			case 'number': {
				if (!VALIDATORS.number(value)) throw createValidationError(fieldName, type);
				break;
			}
			case 'boolean': {
				if (!VALIDATORS.boolean(value)) throw createValidationError(fieldName, type);
				break;
			}
			default:
				throw createValidationError(fieldName, type);
		}
		Object.assign(user, { [fieldName]: value });
	}
}
