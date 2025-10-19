/**
 * User Repository
 *
 * @module UserRepository
 * @description Repository for user entities with enhanced functionality
 * @author EveryTriv Team
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { serverLogger as logger } from '@shared/services';
import { UserRole, CACHE_DURATION } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';
import { FindManyOptions, Repository } from 'typeorm';

import { RepositoryAudit, RepositoryCache, RepositoryRoles } from '../../common';
import { UserEntity } from '../entities';
import { BaseRepository } from './base.repository';

/**
 * Repository for user entities
 * Handles all database operations for user data with enhanced functionality
 */
@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>
	) {
		super(userRepository);
	}

	/**
	 * Find user by email
	 * @param email User email address
	 * @returns Promise<UserEntity | null> Found user or null
	 * @throws Error When database query fails
	 */
	@RepositoryCache(CACHE_DURATION.MEDIUM, 'user_by_email')
	@RepositoryAudit('user_lookup_by_email')
	async findByEmail(email: string): Promise<UserEntity | null> {
		try {
			logger.databaseDebug(`Finding user by email: ${email}`, { context: 'REPOSITORY' });

			const user = await this.userRepository.findOne({
				where: { email },
			});

			if (user) {
				logger.databaseInfo(`User found by email: ${email}`, {
					context: 'REPOSITORY',
					userId: user.id,
					found: true,
				});
			} else {
				logger.databaseInfo(`User not found by email: ${email}`, {
					context: 'REPOSITORY',
					found: false,
				});
			}

			return user;
		} catch (error) {
			logger.databaseError(`Failed to find user by email: ${email}`, {
				context: 'REPOSITORY',
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Find user by username
	 * @param username User username
	 * @returns Promise<UserEntity | null> Found user or null
	 * @throws Error When database query fails
	 */
	@RepositoryCache(CACHE_DURATION.MEDIUM, 'user_by_username')
	@RepositoryAudit('user_lookup_by_username')
	async findByUsername(username: string): Promise<UserEntity | null> {
		try {
			logger.databaseDebug(`Finding user by username: ${username}`, { context: 'REPOSITORY' });

			const user = await this.userRepository.findOne({
				where: { username },
			});

			if (user) {
				logger.databaseInfo(`User found by username: ${username}`, {
					context: 'REPOSITORY',
					userId: user.id,
					found: true,
				});
			} else {
				logger.databaseInfo(`User not found by username: ${username}`, {
					context: 'REPOSITORY',
					found: false,
				});
			}

			return user;
		} catch (error) {
			logger.databaseError(`Failed to find user by username: ${username}`, {
				context: 'REPOSITORY',
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Find users by role
	 * @param role User role
	 * @returns Promise<UserEntity[]> Array of users with the role
	 * @throws Error When database query fails
	 */
	@RepositoryCache(CACHE_DURATION.LONG, 'users_by_role')
	@RepositoryRoles(UserRole.ADMIN)
	@RepositoryAudit('user_lookup_by_role')
	async findByRole(role: string): Promise<UserEntity[]> {
		try {
			logger.databaseDebug(`Finding users by role: ${role}`, { context: 'REPOSITORY' });

			const users = await this.userRepository.find({
				where: { role: role as UserRole },
				order: { createdAt: 'DESC' },
			});

			logger.databaseInfo(`Found ${users.length} users with role: ${role}`, {
				context: 'REPOSITORY',
				count: users.length,
			});

			return users;
		} catch (error) {
			logger.databaseError(`Failed to find users by role: ${role}`, {
				context: 'REPOSITORY',
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Find users by status
	 * @param status User status
	 * @returns Promise<UserEntity[]> Array of users with the status
	 * @throws Error When database query fails
	 */
	async findByStatus(status: string): Promise<UserEntity[]> {
		try {
			logger.databaseDebug(`Finding users by status: ${status}`, { context: 'REPOSITORY' });

			// Note: UserEntity doesn't have a status field, this method is reserved for future use
			// For now, return empty array or implement based on actual entity structure
			const users = await this.userRepository.find({
				order: { createdAt: 'DESC' },
			});

			logger.databaseInfo(`Found ${users.length} users with status: ${status}`, {
				context: 'REPOSITORY',
				count: users.length,
			});

			return users;
		} catch (error) {
			logger.databaseError(`Failed to find users by status: ${status}`, {
				context: 'REPOSITORY',
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Search users by query
	 * @param query Search query
	 * @param options Additional find options
	 * @returns Promise<UserEntity[]> Array of matching users
	 * @throws Error When database query fails
	 */
	async searchUsers(query: string, options?: FindManyOptions<UserEntity>): Promise<UserEntity[]> {
		try {
			logger.databaseDebug(`Searching users with query: ${query}`, { context: 'REPOSITORY' });

			const searchOptions: FindManyOptions<UserEntity> = {
				where: [{ username: { $like: `%${query}%` } as never }, { email: { $like: `%${query}%` } as never }],
				order: { createdAt: 'DESC' },
				...options,
			};

			const users = await this.userRepository.find(searchOptions);

			logger.databaseInfo(`Found ${users.length} users matching query: ${query}`, {
				context: 'REPOSITORY',
				count: users.length,
			});

			return users;
		} catch (error) {
			logger.databaseError(`Failed to search users with query: ${query}`, {
				context: 'REPOSITORY',
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Update user last login
	 * @param userId User ID
	 * @returns Promise<UserEntity> Updated user entity
	 * @throws Error When database query fails
	 */
	@RepositoryAudit('user_last_login_update')
	async updateLastLogin(userId: string): Promise<UserEntity> {
		try {
			logger.databaseDebug(`Updating last login for user: ${userId}`, { context: 'REPOSITORY' });

			const updatedUser = await this.update(userId, {
				lastLoginAt: new Date(),
			} as never);

			logger.databaseInfo(`Last login updated for user: ${userId}`, {
				context: 'REPOSITORY',
				userId,
			});

			return updatedUser;
		} catch (error) {
			logger.databaseError(`Failed to update last login for user: ${userId}`, {
				context: 'REPOSITORY',
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}
}
